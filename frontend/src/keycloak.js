import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8081',
  realm: 'nitte-shop',
  clientId: 'nitte-shop-app',
});

export default keycloak;