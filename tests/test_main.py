import unittest
from app.main import app

class TestMain(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()

    def test_health_check_pass(self):
        # Test designed to pass
        response = self.app.get('/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["status"], "healthy")

if __name__ == '__main__':
    unittest.main()