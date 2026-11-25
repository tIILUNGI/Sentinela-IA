import unittest

from app.services.risk import calculate_risk_score


class RiskEngineTest(unittest.TestCase):
    def test_risk_score_low(self):
        r = calculate_risk_score(1, 1, 1, 1, 3)
        self.assertEqual(r.level, "low")
        self.assertTrue(0 <= r.score <= 100)

    def test_risk_score_critical(self):
        r = calculate_risk_score(5, 5, 5, 5, 5)
        self.assertEqual(r.level, "critical")
        self.assertGreaterEqual(r.score, 75)

    def test_risk_requires_human_review_for_low_evidence(self):
        r = calculate_risk_score(2, 2, 2, 2, 1)
        self.assertTrue(r.requires_human_review)

        r2 = calculate_risk_score(4, 5, 4, 4, 3)
        self.assertIn(r2.level, {"high", "critical"})
        self.assertTrue(r2.requires_human_review)
