# Clerk Backend API Documentation

## Overview

The Clerk REST Backend API, meant to be accessed by backend servers.

**Version**: v2025-11-10  
**API Version**: OAS 3.0.3  
**Server**: https://api.clerk.com/v1

## Authentication

**Required**: Bearer Token (Secret key)

Secret key, obtained under "API Keys" in the Clerk Dashboard.

## API Versions

When the API changes in a way that isn't compatible with older versions, a new version is released. Each version is identified by its release date, e.g. 2025-04-10. For more information, please see [Clerk API Versions](https://clerk.com/docs).

---

## Actor Tokens

Allow your users to sign in on behalf of other users.

### Operations

- `POST /actor_tokens` - Create actor token
- `POST /actor_tokens/{actor_token_id}/revoke` - Revoke actor token

### Create actor token

Create an actor token that can be used to impersonate the given user. The actor parameter needs to include at least a "sub" key whose value is the ID of the actor (impersonating) user.

**Request Body**: `application/json`

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| actor | object | Yes | The actor payload. It needs to include a sub property which should contain the ID of the actor. This whole payload will be also included in the JWT session token. |
| user_id | string | Yes | The ID of the user being impersonated. |
| expires_in_seconds | integer | No | Optional parameter to specify the life duration of the actor token in seconds. By default, the duration is 1 hour. Default: 3600 |
| session_max_duration_in_seconds | integer | No | The maximum duration that the session which will be created by the generated actor token should last. By default, the duration of a session created via an actor token, lasts 30 minutes. Default: 1800 |

#### Responses

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Request was not successful |
| 402 | Payment required |
| 422 | Invalid request parameters |

#### Example Request

```bash
curl https://api.clerk.com/v1/actor_tokens \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN' \
  --data '{
  "user_id": "",
  "actor": {
    "sub": "user_2OEpKhcCN1Lat9NQ0G6puh7q5Rb"
  },
  "expires_in_seconds": 3600,
  "session_max_duration_in_seconds": 1800
}'
```

#### Example Response (200)

```json
{
  "object": "actor_token",
  "id": "string",
  "status": "pending",
  "user_id": "string",
  "actor": {},
  "token": "string",
  "url": "string",
  "created_at": 1,
  "updated_at": 1
}
```

### Revoke actor token

Revokes a pending actor token.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| actor_token_id | string | Yes | The ID of the actor token to be revoked. |

#### Responses

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Request was not successful |
| 404 | Resource not found |

#### Example Request

```bash
curl 'https://api.clerk.com/v1/actor_tokens/{actor_token_id}/revoke' \
  --request POST \
  --header 'Authorization: Bearer YOUR_SECRET_TOKEN'
```

#### Example Response (200)

```json
{
  "object": "actor_token",
  "id": "string",
  "status": "pending",
  "user_id": "string",
  "actor": {},
  "token": "string",
  "url": "string",
  "created_at": 1,
  "updated_at": 1
}
```

---

## API Categories

### Allow-list / Block-list

Allow-lists and Block-lists allow you to control who can sign up or sign in to your application, by restricting access based on the user's email address or phone number.

**Operations**:
- `GET /allowlist_identifiers`
- `POST /allowlist_identifiers`
- `DELETE /allowlist_identifiers/{identifier_id}`
- `GET /blocklist_identifiers`
- `POST /blocklist_identifiers`
- `DELETE /blocklist_identifiers/{identifier_id}`

### Clients

The Client object tracks sessions, as well as the state of any sign in and sign up attempts, for a given device.

**Operations**:
- `GET /clients`
- `POST /clients/verify`
- `GET /clients/{client_id}`

### Billing

Billing-related endpoints for managing statements and payment attempts.

**Operations**:
- `GET /users/{user_id}/billing/subscription`
- `GET /organizations/{organization_id}/billing/subscription`
- `GET /billing/plans`
- `GET /billing/subscription_items`
- `DELETE /billing/subscription_items/{subscription_item_id}`
- `POST /billing/subscription_items/{subscription_item_id}/extend_free_trial`
- `GET /billing/statements`
- `GET /billing/statements/{statementID}`
- `GET /billing/statements/{statementID}/payment_attempts`

### Domains

Domains represent each instance's URLs and DNS setup.

**Operations**:
- `GET /domains`
- `POST /domains`
- `DELETE /domains/{domain_id}`
- `PATCH /domains/{domain_id}`

### Email Addresses

A user can be associated with one or more email addresses, which allows them to be contacted via email.

**Operations**:
- `POST /email_addresses`
- `GET /email_addresses/{email_address_id}`
- `DELETE /email_addresses/{email_address_id}`
- `PATCH /email_addresses/{email_address_id}`

### Email & SMS Templates

Email & SMS templates allow you to customize the theming and wording of emails & SMS messages that are sent by your instance.

**Operations**:
- `GET /templates/{template_type}`
- `GET /templates/{template_type}/{slug}`
- `PUT /templates/{template_type}/{slug}`
- `POST /templates/{template_type}/{slug}/revert`
- `POST /templates/{template_type}/{slug}/preview`
- `POST /templates/{template_type}/{slug}/toggle_delivery`

### Instance Settings

Modify the settings of your instance.

**Operations**:
- `GET /instance`
- `PATCH /instance`
- `PATCH /instance/restrictions`
- `PATCH /instance/organization_settings`

### Invitations

Invitations allow you to invite someone to sign up to your application, via email.

**Operations**:
- `POST /invitations`
- `GET /invitations`
- `POST /invitations/bulk`
- `POST /invitations/{invitation_id}/revoke`

### JWKS

Retrieve the JSON Web Key Set which can be used to verify the token signatures of the instance.

**Operations**:
- `GET /jwks`

### JWT Templates

JWT Templates allow you to generate custom authentication tokens tied to authenticated sessions, enabling you to integrate with third-party services.

**Operations**:
- `GET /jwt_templates`
- `POST /jwt_templates`
- `GET /jwt_templates/{template_id}`
- `PATCH /jwt_templates/{template_id}`
- `DELETE /jwt_templates/{template_id}`

### OAuth Applications

OAuth applications contain data for clients using Clerk as an OAuth2 identity provider.

**Operations**:
- `GET /oauth_applications`
- `POST /oauth_applications`
- `GET /oauth_applications/{oauth_application_id}`
- `PATCH /oauth_applications/{oauth_application_id}`
- `DELETE /oauth_applications/{oauth_application_id}`
- `POST /oauth_applications/{oauth_application_id}/rotate_secret`

### OAuth Access Tokens

Endpoints for managing OAuth Access Tokens, which are credentials to access protected resources on behalf of a user.

**Operations**:
- `POST /oauth_applications/access_tokens/verify`

### Organizations

Organizations are used to group members under a common entity and provide shared access to resources.

**Operations**:
- `GET /organizations`
- `POST /organizations`
- `GET /organizations/{organization_id}`
- `PATCH /organizations/{organization_id}`
- `DELETE /organizations/{organization_id}`
- `PATCH /organizations/{organization_id}/metadata`
- `PUT /organizations/{organization_id}/logo`
- `DELETE /organizations/{organization_id}/logo`
- `GET /organizations/{organization_id}/billing/subscription`

### Organization Invitations

Invite users to an organization.

**Operations**:
- `GET /organization_invitations`
- `POST /organizations/{organization_id}/invitations`
- `GET /organizations/{organization_id}/invitations`
- `POST /organizations/{organization_id}/invitations/bulk`
- `GET /organizations/{organization_id}/invitations/pending`
- `GET /organizations/{organization_id}/invitations/{invitation_id}`
- `POST /organizations/{organization_id}/invitations/{invitation_id}/revoke`

### Organization Memberships

Manage member roles in an organization.

**Operations**:
- `POST /organizations/{organization_id}/memberships`
- `GET /organizations/{organization_id}/memberships`
- `PATCH /organizations/{organization_id}/memberships/{user_id}`
- `DELETE /organizations/{organization_id}/memberships/{user_id}`
- `PATCH /organizations/{organization_id}/memberships/{user_id}/metadata`
- `GET /organization_memberships`

### Phone Numbers

A user can be associated with one or more phone numbers, which allows them to be contacted via SMS.

**Operations**:
- `POST /phone_numbers`
- `GET /phone_numbers/{phone_number_id}`
- `DELETE /phone_numbers/{phone_number_id}`
- `PATCH /phone_numbers/{phone_number_id}`

### Redirect URLs

Redirect URLs are whitelisted URLs that facilitate secure authentication flows in native applications (e.g. React Native, Expo). In these contexts, Clerk ensures that security-critical nonces are passed only to the whitelisted URLs.

**Operations**:
- `GET /redirect_urls`
- `POST /redirect_urls`
- `GET /redirect_urls/{id}`
- `DELETE /redirect_urls/{id}`

### SAML Connections

A SAML Connection holds configuration data required for facilitating a SAML SSO flow between your Clerk Instance (SP) and a particular SAML IdP.

**Operations**:
- `GET /saml_connections`
- `POST /saml_connections`
- `GET /saml_connections/{saml_connection_id}`
- `PATCH /saml_connections/{saml_connection_id}`
- `DELETE /saml_connections/{saml_connection_id}`

### Sessions

The Session object is an abstraction over an HTTP session. It models the period of information exchange between a user and the server. Sessions are created when a user successfully goes through the sign in or sign up flows.

**Operations**:
- `GET /sessions`
- `POST /sessions`
- `GET /sessions/{session_id}`
- `POST /sessions/{session_id}/refresh`
- `POST /sessions/{session_id}/revoke`
- `POST /sessions/{session_id}/tokens`
- `POST /sessions/{session_id}/tokens/{template_name}`

### Machines

A Machine represents a machine/server/service which can be used in machine-to-machine authentication.

**Operations**:
- `GET /machines`
- `POST /machines`
- `GET /machines/{machine_id}`
- `PATCH /machines/{machine_id}`
- `DELETE /machines/{machine_id}`
- `GET /machines/{machine_id}/secret_key`
- `POST /machines/{machine_id}/secret_key/rotate`
- `POST /machines/{machine_id}/scopes`
- `DELETE /machines/{machine_id}/scopes/{other_machine_id}`

### M2M Tokens

Machine to Machine Tokens are used to manage authentication between Machines.

**Operations**:
- `POST /m2m_tokens`
- `GET /m2m_tokens`
- `POST /m2m_tokens/{m2m_token_id}/revoke`
- `POST /m2m_tokens/verify`

### Sign-in Tokens

Sign-in tokens are JWTs that can be used to sign in to an application without specifying any credentials. A sign-in token can be used at most once and they can be consumed from the Frontend API using the ticket strategy.

**Operations**:
- `POST /sign_in_tokens`
- `POST /sign_in_tokens/{sign_in_token_id}/revoke`

### Sign Ups

Sign-up objects track the progress of a sign-up attempt and store any field collected from user input.

**Operations**:
- `GET /sign_ups/{id}`
- `PATCH /sign_ups/{id}`

### Testing Tokens

Tokens meant for use by end-to-end test suites in requests to the Frontend API, so as to bypass bot detection measures.

**Operations**:
- `POST /testing_tokens`

### Users

The user object represents a user that has successfully signed up to your application.

**Operations**:
- `GET /users`
- `POST /users`
- `GET /users/count`
- `GET /users/{user_id}`
- `PATCH /users/{user_id}`
- `DELETE /users/{user_id}`
- `POST /users/{user_id}/ban`
- `POST /users/{user_id}/unban`
- `POST /users/ban`
- `POST /users/unban`
- `POST /users/{user_id}/lock`
- `POST /users/{user_id}/unlock`
- `POST /users/{user_id}/profile_image`
- `DELETE /users/{user_id}/profile_image`
- `PATCH /users/{user_id}/metadata`
- `GET /users/{user_id}/billing/subscription`
- `GET /users/{user_id}/oauth_access_tokens/{provider}`
- `GET /users/{user_id}/organization_memberships`
- `GET /users/{user_id}/organization_invitations`
- `POST /users/{user_id}/verify_password`
- `POST /users/{user_id}/verify_totp`
- `DELETE /users/{user_id}/mfa`
- `DELETE /users/{user_id}/backup_code`
- `DELETE /users/{user_id}/passkeys/{passkey_identification_id}`
- `DELETE /users/{user_id}/web3_wallets/{web3_wallet_identification_id}`
- `DELETE /users/{user_id}/totp`
- `DELETE /users/{user_id}/external_accounts/{external_account_id}`

### Webhooks

You can configure webhooks to be notified about various events that happen on your instance.

**Operations**:
- `POST /webhooks/svix`
- `DELETE /webhooks/svix`
- `POST /webhooks/svix_url`

### Miscellaneous

Various endpoints that do not belong in any particular category.

**Operations**:
- `GET /public/interstitial`

### Beta Features

Modify instance settings that are currently in beta.

**Operations**:
- `PATCH /beta_features/instance_settings`
- `PUT /beta_features/domain`
- `POST /instance/change_domain`

### Waitlist Entries

Manage waitlist entries.

**Operations**:
- `GET /waitlist_entries`
- `POST /waitlist_entries`
- `DELETE /waitlist_entries/{waitlist_entry_id}`
- `POST /waitlist_entries/{waitlist_entry_id}/invite`
- `POST /waitlist_entries/{waitlist_entry_id}/reject`

### Proxy Checks

Check if a user is using a proxy.

**Operations**:
- `POST /proxy_checks`

### Organization Domains

Manage organization domains.

**Operations**:
- `POST /organizations/{organization_id}/domains`
- `GET /organizations/{organization_id}/domains`
- `PATCH /organizations/{organization_id}/domains/{domain_id}`
- `DELETE /organizations/{organization_id}/domains/{domain_id}`
- `GET /organization_domains`

---

## Data Models

### JWKS Models

- `JWKS.ed25519.PublicKey`
- `JWKS.ecdsa.PublicKey`
- `JWKS.rsa.PublicKey`
- `JWKS.ed25519.PrivateKey`
- `JWKS.ecdsa.PrivateKey`
- `JWKS.rsa.PrivateKey`
- `JWKS.symmetric.Key`
- `JWKS`

### Session Models

- `SessionActivityResponse`
- `SessionTask`

---

## Support

For more information, please see https://clerk.com/docs
