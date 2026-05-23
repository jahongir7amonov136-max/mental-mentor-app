"""Backend API tests for 21-ASR Raqamli Xizmatlar Markazi (v2 extended).
Covers: auth, KYC flow, service catalog (v2 items), requests with
documents[]+ekey_files[], rating, support chat, about/team/contact,
admin stats and gating.
"""
import os
import uuid
import base64
import pytest
import requests

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    os.environ.get("EXPO_BACKEND_URL", "https://gov-services-10.preview.emergentagent.com"),
).rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@swsp.uz"
ADMIN_PASSWORD = "Admin@123"

B64 = base64.b64encode(b"dummy-bytes").decode()


# ------------- Fixtures -------------
@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(http):
    r = http.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def user_creds():
    suffix = uuid.uuid4().hex[:8]
    return {
        "first_name": "TEST",
        "last_name": f"User_{suffix}",
        "phone": f"+99890{suffix[:7]}",
        "email": f"TEST_{suffix}@swsp.uz",
        "password": "Test@123",
    }


@pytest.fixture(scope="session")
def user_reg(http, user_creds):
    r = http.post(f"{API}/auth/register", json=user_creds)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"token": data["access_token"], "user_id": data["user"]["id"]}


@pytest.fixture(scope="session")
def user_token(user_reg):
    return user_reg["token"]


@pytest.fixture(scope="session")
def user_id(user_reg):
    return user_reg["user_id"]


def auth(t):
    return {"Authorization": f"Bearer {t}"}


def file_item(name="doc.txt", mime="text/plain", field="document"):
    return {"name": name, "mime": mime, "size": 10, "content": B64, "field": field}


# ------------- Health -------------
class TestHealth:
    def test_root(self, http):
        r = http.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


# ------------- Auth (regression) -------------
class TestAuth:
    def test_me(self, http, user_token, user_creds):
        r = http.get(f"{API}/auth/me", headers=auth(user_token))
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == user_creds["email"].lower()
        assert d["role"] == "user"
        assert d["kyc_status"] == "none"

    def test_login_valid(self, http, user_creds):
        r = http.post(f"{API}/auth/login", json={"email": user_creds["email"], "password": user_creds["password"]})
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_invalid(self, http, user_creds):
        r = http.post(f"{API}/auth/login", json={"email": user_creds["email"], "password": "wrong"})
        assert r.status_code == 401

    def test_me_requires_auth(self, http):
        r = http.get(f"{API}/auth/me")
        assert r.status_code == 401


# ------------- Catalog v2 -------------
class TestCatalog:
    def test_catalog_contains_v2_items(self, http):
        r = http.get(f"{API}/services/catalog")
        assert r.status_code == 200
        d = r.json()
        sw_ids = {x["id"] for x in d["single_window"]}
        ac_ids = {x["id"] for x in d["accounting"]}
        # v2 mandatory items
        required_sw = {"sw_passport", "sw_divorce"}
        required_ac = {"ac_yatt_open", "ac_yatt_close", "ac_yatt_freeze",
                       "ac_corp_open", "ac_corp_close", "ac_ekey"}
        missing = (required_sw - sw_ids) | (required_ac - ac_ids)
        assert not missing, f"Missing v2 items: {missing}"
        # shape check
        sample = d["single_window"][0]
        for k in ["id", "title_uz", "title_ru", "title_en", "icon"]:
            assert k in sample


# ------------- KYC -------------
class TestKYC:
    def test_kyc_me_initial_none(self, http, user_token):
        r = http.get(f"{API}/kyc/me", headers=auth(user_token))
        assert r.status_code == 200
        d = r.json()
        assert d["status"] == "none"
        assert d["has_passport"] is False
        assert d["has_selfie"] is False

    def test_request_blocked_before_kyc(self, http, user_token):
        """Without KYC approved, POST /requests must return 403."""
        body = {
            "category": "single_window",
            "service_id": "sw_passport",
            "service_title": "Passport",
            "form_data": {},
            "documents": [file_item()],
            "ekey_files": [],
        }
        r = http.post(f"{API}/requests", json=body, headers=auth(user_token))
        assert r.status_code == 403
        assert "KYC" in r.json().get("detail", "") or "approved" in r.json().get("detail", "").lower()

    def test_kyc_submit_sets_pending(self, http, user_token):
        body = {
            "passport_photo": file_item(name="passport.jpg", mime="image/jpeg", field="passport"),
            "selfie_photo": file_item(name="selfie.jpg", mime="image/jpeg", field="selfie"),
        }
        r = http.post(f"{API}/kyc/submit", json=body, headers=auth(user_token))
        assert r.status_code == 200
        assert r.json()["status"] == "pending"
        # verify via /kyc/me
        r2 = http.get(f"{API}/kyc/me", headers=auth(user_token))
        d = r2.json()
        assert d["status"] == "pending"
        assert d["has_passport"] is True
        assert d["has_selfie"] is True
        # verify /auth/me reflects pending
        r3 = http.get(f"{API}/auth/me", headers=auth(user_token))
        assert r3.json()["kyc_status"] == "pending"

    def test_admin_kyc_list(self, http, admin_token, user_id):
        r = http.get(f"{API}/admin/kyc?status=pending", headers=auth(admin_token))
        assert r.status_code == 200
        ids = [u["id"] for u in r.json()]
        assert user_id in ids

    def test_admin_kyc_detail(self, http, admin_token, user_id):
        r = http.get(f"{API}/admin/kyc/{user_id}", headers=auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["id"] == user_id
        assert d["record"]["passport_photo"]["content"]
        assert d["record"]["selfie_photo"]["content"]

    def test_admin_kyc_approve(self, http, admin_token, user_token, user_id):
        r = http.patch(f"{API}/admin/kyc/{user_id}",
                       json={"decision": "approved", "note": "ok"},
                       headers=auth(admin_token))
        assert r.status_code == 200
        assert r.json()["status"] == "approved"
        # user sees approved
        r2 = http.get(f"{API}/auth/me", headers=auth(user_token))
        assert r2.json()["kyc_status"] == "approved"


# ------------- Requests (v2 schema) -------------
class TestRequests:
    def test_create_request_with_documents_and_ekey(self, http, user_token):
        body = {
            "category": "accounting",
            "service_id": "ac_ekey",
            "service_title": "ERI",
            "form_data": {"note": "TEST"},
            "documents": [file_item(name="passport_copy.pdf", mime="application/pdf", field="document")],
            "ekey_files": [file_item(name="key.pfx", mime="application/x-pkcs12", field="ekey")],
        }
        r = http.post(f"{API}/requests", json=body, headers=auth(user_token))
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        assert d["service_id"] == "ac_ekey"
        assert len(d["files"]) == 2
        fields = sorted(f["field"] for f in d["files"])
        assert fields == ["document", "ekey"]
        # content stripped in create response
        assert "content" not in d["files"][0]
        pytest.request_id = d["id"]

    def test_mine_lists_request(self, http, user_token):
        r = http.get(f"{API}/requests/mine", headers=auth(user_token))
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()]
        assert pytest.request_id in ids

    def test_get_request_owner_sees_content(self, http, user_token):
        r = http.get(f"{API}/requests/{pytest.request_id}", headers=auth(user_token))
        assert r.status_code == 200
        d = r.json()
        assert d["files"][0].get("content")

    def test_admin_can_read_any(self, http, admin_token):
        r = http.get(f"{API}/requests/{pytest.request_id}", headers=auth(admin_token))
        assert r.status_code == 200


# ------------- Rating -------------
class TestRating:
    def test_rate_before_approved_fails(self, http, user_token):
        r = http.post(f"{API}/requests/{pytest.request_id}/rate",
                      json={"rating": 5, "comment": "great"},
                      headers=auth(user_token))
        assert r.status_code == 400

    def test_rate_after_approved_ok(self, http, admin_token, user_token):
        # admin approves
        r = http.patch(f"{API}/admin/requests/{pytest.request_id}/status",
                       json={"status": "approved", "admin_note": "done"},
                       headers=auth(admin_token))
        assert r.status_code == 200
        # user rates
        r2 = http.post(f"{API}/requests/{pytest.request_id}/rate",
                       json={"rating": 5, "comment": "great"},
                       headers=auth(user_token))
        assert r2.status_code == 200
        d = r2.json()
        assert d["rating"] == 5
        assert d["closed"] is True
        assert d["rating_comment"] == "great"

    def test_rate_duplicate_fails(self, http, user_token):
        r = http.post(f"{API}/requests/{pytest.request_id}/rate",
                      json={"rating": 4},
                      headers=auth(user_token))
        assert r.status_code == 400
        assert "rated" in r.json().get("detail", "").lower()

    def test_rate_range_validation(self, http, user_token):
        # Out of range (0 or 6) should 422
        r = http.post(f"{API}/requests/{pytest.request_id}/rate",
                      json={"rating": 6},
                      headers=auth(user_token))
        assert r.status_code == 422


# ------------- Support Chat -------------
class TestSupport:
    def test_user_post_message(self, http, user_token):
        r = http.post(f"{API}/support/messages",
                      json={"text": "TEST Hello admin"},
                      headers=auth(user_token))
        assert r.status_code == 200
        d = r.json()
        assert d["sender"] == "user"
        assert d["text"] == "TEST Hello admin"

    def test_user_list_own_messages_sorted(self, http, user_token):
        # post second
        http.post(f"{API}/support/messages",
                  json={"text": "TEST second"}, headers=auth(user_token))
        r = http.get(f"{API}/support/messages/mine", headers=auth(user_token))
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 2
        # sorted ascending
        ts = [m["created_at"] for m in msgs]
        assert ts == sorted(ts)

    def test_admin_threads_and_messages(self, http, admin_token, user_id):
        r = http.get(f"{API}/admin/support/threads", headers=auth(admin_token))
        assert r.status_code == 200
        uids = [t["user_id"] for t in r.json()]
        assert user_id in uids

        r2 = http.get(f"{API}/admin/support/messages/{user_id}", headers=auth(admin_token))
        assert r2.status_code == 200
        assert len(r2.json()) >= 2

    def test_admin_post_message(self, http, admin_token, user_token, user_id):
        r = http.post(f"{API}/admin/support/messages",
                      json={"user_id": user_id, "text": "TEST admin reply"},
                      headers=auth(admin_token))
        assert r.status_code == 200
        assert r.json()["sender"] == "admin"
        # user sees it
        r2 = http.get(f"{API}/support/messages/mine", headers=auth(user_token))
        texts = [m["text"] for m in r2.json()]
        assert "TEST admin reply" in texts


# ------------- About / Team / Contact -------------
class TestAbout:
    def test_about_public(self, http):
        r = http.get(f"{API}/about")
        assert r.status_code == 200
        d = r.json()
        assert "team" in d and "contact" in d
        # seeded team has 4 members with expected roles
        names = [m["name"] for m in d["team"]]
        # Check at least 4 and contains core roles
        assert len(d["team"]) >= 4
        joined = " | ".join(names)
        for expected in ["Director", "Bosh Buxgalter", "Buxgalter", "Moliya"]:
            assert expected in joined, f"Expected '{expected}' in team names: {joined}"
        # contact seeded
        assert d["contact"].get("email")

    def test_admin_team_crud(self, http, admin_token):
        payload = {"name": "TEST Member", "role": "Tester", "email": "t@t.uz",
                   "phone": "+998900000001", "order": 99, "bio": "TEST bio"}
        r = http.post(f"{API}/admin/team", json=payload, headers=auth(admin_token))
        assert r.status_code == 200
        mid = r.json()["id"]

        # appears in about
        about = http.get(f"{API}/about").json()
        assert mid in [m["id"] for m in about["team"]]

        # update
        upd = dict(payload); upd["role"] = "Senior Tester"
        r2 = http.patch(f"{API}/admin/team/{mid}", json=upd, headers=auth(admin_token))
        assert r2.status_code == 200
        assert r2.json()["role"] == "Senior Tester"

        # delete
        r3 = http.delete(f"{API}/admin/team/{mid}", headers=auth(admin_token))
        assert r3.status_code == 200
        assert r3.json()["ok"] is True
        about2 = http.get(f"{API}/about").json()
        assert mid not in [m["id"] for m in about2["team"]]

    def test_admin_contact_update(self, http, admin_token):
        r = http.patch(f"{API}/admin/contact",
                       json={"phone": "+998 (99) 111-22-33", "telegram": "@testch"},
                       headers=auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        assert d["phone"] == "+998 (99) 111-22-33"
        assert d["telegram"] == "@testch"
        # verify via public GET
        about = http.get(f"{API}/about").json()
        assert about["contact"]["phone"] == "+998 (99) 111-22-33"


# ------------- Admin Stats & Gating -------------
class TestAdminStats:
    def test_admin_stats_has_v2_fields(self, http, admin_token):
        r = http.get(f"{API}/admin/stats", headers=auth(admin_token))
        assert r.status_code == 200
        d = r.json()
        for k in ["total", "pending", "in_review", "approved", "rejected",
                  "users", "kyc_pending", "support_open"]:
            assert k in d, f"missing key {k}"
            assert isinstance(d[k], int)

    def test_non_admin_blocked_on_v2_endpoints(self, http, user_token, user_id):
        endpoints = [
            ("GET", "/admin/kyc", None),
            ("GET", f"/admin/kyc/{user_id}", None),
            ("PATCH", f"/admin/kyc/{user_id}", {"decision": "approved"}),
            ("GET", "/admin/support/threads", None),
            ("GET", f"/admin/support/messages/{user_id}", None),
            ("POST", "/admin/support/messages", {"user_id": user_id, "text": "x"}),
            ("POST", "/admin/team", {"name": "x", "role": "x"}),
            ("PATCH", "/admin/contact", {"phone": "x"}),
            ("GET", "/admin/stats", None),
            ("GET", "/admin/requests", None),
        ]
        for method, path, body in endpoints:
            r = http.request(method, f"{API}{path}", json=body, headers=auth(user_token))
            assert r.status_code == 403, f"{method} {path} => {r.status_code}"
