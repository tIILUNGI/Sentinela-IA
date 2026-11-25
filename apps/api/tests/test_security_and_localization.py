import unittest

from app.core.localization import localize_detail
from app.core.security import create_access_token, create_refresh_token, decode_token, get_password_hash, verify_password


class SecurityAndLocalizationTest(unittest.TestCase):
    def test_password_hash_and_verify(self):
        h = get_password_hash("Sentinela@2026")
        self.assertTrue(verify_password("Sentinela@2026", h))
        self.assertFalse(verify_password("wrong", h))

    def test_access_and_refresh_tokens_roundtrip(self):
        a = create_access_token("user-1")
        r = create_refresh_token("user-1")
        da = decode_token(a)
        dr = decode_token(r)
        self.assertEqual(da["sub"], "user-1")
        self.assertEqual(da["type"], "access")
        self.assertEqual(dr["type"], "refresh")

    def test_localization_portuguese(self):
        self.assertEqual(localize_detail("Invalid credentials", "pt-BR"), "Credenciais inválidas.")
        self.assertEqual(localize_detail("Invalid or expired reset token", "pt-PT"), "Ligação de reposição inválida ou expirada.")
        self.assertEqual(localize_detail("AI unavailable", "pt"), "IA indisponível.")

    def test_localization_english_passthrough(self):
        self.assertEqual(localize_detail("Invalid credentials", "en-US"), "Invalid credentials")
        self.assertEqual(localize_detail("Unknown message", "pt"), "Unknown message")
