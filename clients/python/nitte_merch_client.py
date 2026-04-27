"""
NITTE Merchandise Shop API Client
Python SDK for consuming the API
"""

import requests
import json
from typing import List, Dict, Optional, Any
from urllib.parse import urlencode


class NitteMerchClient:
    """Python client for NITTE Merchandise Shop API"""

    def __init__(self, base_url: str = "http://localhost:3000", timeout: int = 30):
        """
        Initialize the API client

        Args:
            base_url: Base URL of the API
            timeout: Timeout for requests in seconds
        """
        self.base_url = base_url
        self.api_url = f"{base_url}/api/v1"
        self.timeout = timeout
        self.access_token = None
        self.refresh_token = None
        self.session = requests.Session()

    def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """
        Make an API request

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint
            **kwargs: Additional request parameters

        Returns:
            Response JSON data
        """
        url = f"{self.api_url}/{endpoint}"
        headers = kwargs.pop("headers", {})

        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        headers["Content-Type"] = "application/json"

        try:
            response = self.session.request(
                method,
                url,
                headers=headers,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            error_msg = e.response.json().get("message", str(e))
            raise Exception(f"{method} {endpoint} failed: {error_msg}")
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    # =====================
    # Authentication Methods
    # =====================

    def signup(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """
        Register a new user

        Args:
            email: User email
            password: User password
            name: User name

        Returns:
            User data
        """
        response = self._request(
            "POST",
            "auth/signup",
            json={"email": email, "password": password, "name": name}
        )
        self.access_token = response["tokens"]["access_token"]
        self.refresh_token = response["tokens"]["refresh_token"]
        return response["data"]

    def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Login user

        Args:
            email: User email
            password: User password

        Returns:
            User data
        """
        response = self._request(
            "POST",
            "auth/login",
            json={"email": email, "password": password}
        )
        self.access_token = response["tokens"]["access_token"]
        self.refresh_token = response["tokens"]["refresh_token"]
        return response["data"]

    def logout(self) -> None:
        """Logout user"""
        try:
            self._request("POST", "auth/logout")
        finally:
            self.access_token = None
            self.refresh_token = None

    def refresh_access_token(self) -> str:
        """
        Refresh access token

        Returns:
            New access token
        """
        if not self.refresh_token:
            raise Exception("No refresh token available")

        response = self._request(
            "POST",
            "auth/refresh",
            json={"refresh_token": self.refresh_token}
        )
        self.access_token = response["tokens"]["access_token"]
        return self.access_token

    def get_current_user(self) -> Dict[str, Any]:
        """
        Get current logged-in user

        Returns:
            User data
        """
        response = self._request("GET", "auth/me")
        return response["data"]

    # =====================
    # Product Methods
    # =====================

    def get_products(
        self,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Get all products

        Args:
            category: Filter by category
            skip: Skip N products
            limit: Limit results to N

        Returns:
            List of products
        """
        params = {"skip": skip, "limit": limit}
        if category:
            params["category"] = category

        response = self._request("GET", f"products?{urlencode(params)}")
        return response if isinstance(response, list) else response.get("data", [])

    def get_product(self, product_id: str) -> Dict[str, Any]:
        """
        Get product by ID

        Args:
            product_id: Product ID

        Returns:
            Product data
        """
        response = self._request("GET", f"products/{product_id}")
        return response.get("data", response)

    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new product (admin only)

        Args:
            product_data: Product data

        Returns:
            Created product
        """
        response = self._request("POST", "products", json=product_data)
        return response.get("data", response)

    def update_product(self, product_id: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Update product (admin only)

        Args:
            product_id: Product ID
            product_data: Updated product data

        Returns:
            Updated product
        """
        response = self._request("PUT", f"products/{product_id}", json=product_data)
        return response.get("data", response)

    def delete_product(self, product_id: str) -> bool:
        """
        Delete product (admin only)

        Args:
            product_id: Product ID

        Returns:
            True if successful
        """
        self._request("DELETE", f"products/{product_id}")
        return True

    # =====================
    # Order Methods
    # =====================

    def get_orders(self) -> List[Dict[str, Any]]:
        """
        Get user orders

        Returns:
            List of orders
        """
        response = self._request("GET", "orders")
        return response if isinstance(response, list) else response.get("data", [])

    def get_order(self, order_id: str) -> Dict[str, Any]:
        """
        Get order by ID

        Args:
            order_id: Order ID

        Returns:
            Order data
        """
        response = self._request("GET", f"orders/{order_id}")
        return response.get("data", response)

    def create_order(
        self,
        items: List[Dict[str, Any]],
        shipping_address: str,
        notes: str = ""
    ) -> Dict[str, Any]:
        """
        Create a new order

        Args:
            items: List of order items with product_id and quantity
            shipping_address: Shipping address
            notes: Order notes

        Returns:
            Created order
        """
        response = self._request(
            "POST",
            "orders",
            json={
                "items": items,
                "shipping_address": shipping_address,
                "notes": notes
            }
        )
        return response.get("data", response)

    def update_order(self, order_id: str, status: str, notes: str = "") -> Dict[str, Any]:
        """
        Update order (admin only)

        Args:
            order_id: Order ID
            status: Order status
            notes: Order notes

        Returns:
            Updated order
        """
        response = self._request(
            "PUT",
            f"orders/{order_id}",
            json={"status": status, "notes": notes}
        )
        return response.get("data", response)

    # =====================
    # Health Check Methods
    # =====================

    def get_health(self) -> Dict[str, Any]:
        """
        Get API Gateway health

        Returns:
            Health status
        """
        response = requests.get(f"{self.base_url}/api/health", timeout=self.timeout)
        response.raise_for_status()
        return response.json()

    def get_service_health(self) -> Dict[str, Any]:
        """
        Get all services health status

        Returns:
            Health status of all services
        """
        response = self._request("GET", "service-health")
        return response

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.session.close()


# Usage example
if __name__ == "__main__":
    # Create client
    client = NitteMerchClient(base_url="http://localhost:3000")

    # Example: Signup
    try:
        user = client.signup("user@example.com", "password123", "Test User")
        print(f"Signed up: {user}")
    except Exception as e:
        print(f"Signup error: {e}")

    # Example: Get products
    try:
        products = client.get_products(limit=10)
        print(f"Products: {products}")
    except Exception as e:
        print(f"Get products error: {e}")

    # Example: Create order
    try:
        if products:
            order = client.create_order(
                items=[{"product_id": products[0]["_id"], "quantity": 2}],
                shipping_address="123 Main St, City, State 12345"
            )
            print(f"Order created: {order}")
    except Exception as e:
        print(f"Create order error: {e}")
