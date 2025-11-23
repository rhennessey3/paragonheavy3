# Clerk Frontend API Documentation

## Overview

**API Version:** v1  
**Specification:** OAS 3.0.3  
**Provider:** Clerk Team  
**License:** MIT  

The Clerk REST Frontend API, meant to be accessed from a browser or native environment.

This is a Form Based API and all the data must be sent and formatted according to the application/x-www-form-urlencoded content type.

### Table of Contents

1. [API Information](#api-information)
2. [Server Configuration](#server-configuration)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
   - [Environment](#environment)
   - [Client](#client)
   - [Sessions](#sessions)
   - [Sign Ins](#sign-ins)
   - [Sign Ups](#sign-ups)
   - [User Management](#user-management)
   - [Organization Management](#organization-management)
   - [Well Known Endpoints](#well-known-endpoints)
   - [Development Tools](#development-tools)
   - [OAuth2 & SAML](#oauth2--saml)
5. [Data Models](#data-models)

---

## API Information

### Versions
When the API changes in a way that isn't compatible with older versions, a new version is released. Each version is identified by its release date, e.g. 2021-02-05. For more information, please see Clerk API Versions.

### Using the Try It Console
The Try It feature of the docs only works for Development Instances when using the DevBrowser security scheme. To use it, first generate a dev instance token from the /v1/dev_browser endpoint.

Please see https://clerk.com/docs for more information.

---

## Server Configuration

### Base URL
```
https://{domain}.clerk.accounts.dev
```

### Domain Example
```
example-destined-camel-13
```

---

## Authentication

### Required Authentication
**Selected Auth Type:** DevBrowser & Session

#### DevBrowser Authentication
- **Type:** Query Parameter
- **Name:** `__dev_session`
- **Value:** `QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT`

#### Session Authentication
- **Type:** Header
- **Name:** `__session`
- **Value:** `QUxMIFlPVVIgQkFTRSBBUkUgQkVMT05HIFRPIFVT`

---

## API Endpoints

### Environment

#### Get Environment
**Endpoint:** `GET /v1/environment`

**Description:** Get the current environment. The environment contains information about the settings and features enabled for the current instance.

**Responses:**
- `200 OK` - Returns the environment (application/json)
- `400 Bad Request` - Request was not successful (application/json)
- `401 Unauthorized` - Request was not successful (application/json)

**Example Request:**
```bash
curl https://example-destined-camel-13.clerk.accounts.dev/v1/environment
```

**Example Response (200 OK):**
```json
{
  "auth_config": {
    "object": "auth_config",
    "id": "string",
    "first_name": "on",
    "last_name": "on",
    "email_address": "on",
    "phone_number": "on",
    "username": "on",
    "password": "on",
    "identification_requirements": [["string"]],
    "identification_strategies": ["string"],
    "first_factors": ["string"],
    "second_factors": ["string"],
    "email_address_verification_strategies": ["string"],
    "single_session_mode": true,
    "enhanced_email_deliverability": true,
    "test_mode": true,
    "url_based_session_syncing": true,
    "claimed_at": null,
    "reverification": true
  },
  "display_config": {
    "object": "display_config",
    "id": "string",
    "instance_environment_type": "production",
    "application_name": "string",
    "theme": {},
    "preferred_sign_in_strategy": "password",
    "logo_image_url": null,
    "favicon_image_url": null,
    "home_url": "string",
    "sign_in_url": "string",
    "sign_up_url": "string",
    "user_profile_url": "string",
    "waitlist_url": "string",
    "after_sign_in_url": "string",
    "after_sign_up_url": "string",
    "after_sign_out_one_url": "string",
    "after_sign_out_all_url": "string",
    "after_switch_session_url": "string",
    "after_join_waitlist_url": "string",
    "organization_profile_url": "string",
    "create_organization_url": "string",
    "after_leave_organization_url": "string",
    "after_create_organization_url": "string",
    "logo_link_url": "string",
    "support_email": null,
    "branded": true,
    "experimental_force_oauth_first": true,
    "clerk_js_version": null,
    "show_devmode_warning": true,
    "google_one_tap_client_id": null,
    "help_url": null,
    "privacy_policy_url": null,
    "terms_url": null,
    "captcha_public_key": null,
    "captcha_widget_type": "smart",
    "captcha_public_key_invisible": null,
    "captcha_provider": "turnstile",
    "captcha_oauth_bypass": ["string"],
    "captcha_heartbeat": null
  },
  "user_settings": {
    "attributes": {
      "email_address": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "phone_number": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "username": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "web3_wallet": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "first_name": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "last_name": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "password": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "authenticator_app": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "ticket": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "backup_code": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      },
      "passkey": {
        "enabled": true,
        "required": true,
        "used_for_first_factor": true,
        "first_factors": ["string"],
        "used_for_second_factor": true,
        "second_factors": ["string"],
        "verifications": ["string"],
        "verify_at_sign_up": true
      }
    },
    "social": {
      "oauth_apple": {
        "enabled": true,
        "required": true,
        "authenticatable": true,
        "block_email_subaddresses": true,
        "strategy": "string",
        "not_selectable": true,
        "deprecated": true,
        "name": "Google",
        "logo_url": "https://img.clerk.com/static/google.png"
      },
      "oauth_google": {
        "enabled": true,
        "required": true,
        "authenticatable": true,
        "block_email_subaddresses": true,
        "strategy": "string",
        "not_selectable": true,
        "deprecated": true,
        "name": "Google",
        "logo_url": "https://img.clerk.com/static/google.png"
      }
    },
    "saml": {
      "enabled": true
    },
    "enterprise_sso": {
      "enabled": true
    },
    "sign_in": {
      "second_factor": {
        "required": true
      }
    },
    "sign_up": {
      "captcha_enabled": true,
      "captcha_widget_type": "smart",
      "custom_action_required": true,
      "progressive": true,
      "mode": "public",
      "legal_consent_enabled": true
    },
    "restrictions": {
      "allowlist": {
        "enabled": true
      },
      "blocklist": {
        "enabled": true
      },
      "allowlist_blocklist_disabled_on_sign_in": {
        "enabled": true
      },
      "block_email_subaddresses": {
        "enabled": true
      },
      "block_disposable_email_domains": {
        "enabled": true
      }
    },
    "password_settings": {
      "disable_hibp": true,
      "min_length": 1,
      "max_length": 1,
      "require_special_char": true,
      "require_numbers": true,
      "require_uppercase": true,
      "require_lowercase": true,
      "show_zxcvbn": true,
      "min_zxcvbn_strength": 0,
      "enforce_hibp_on_sign_in": true,
      "allowed_special_characters": "string"
    },
    "username_settings": {
      "min_length": null,
      "max_length": null,
      "allow_extended_special_characters": true
    },
    "actions": {
      "delete_self": true,
      "create_organization": true,
      "create_organizations_limit": null
    },
    "attack_protection": {
      "user_lockout": {
        "enabled": true,
        "max_attempts": 1,
        "duration_in_minutes": 1
      },
      "pii": {
        "enabled": true
      },
      "email_link": {
        "require_same_client": true
      },
      "enumeration_protection": {
        "enabled": true
      }
    },
    "passkey_settings": {
      "allow_autofill": true,
      "show_sign_in_button": true
    }
  },
  "organization_settings": {
    "enabled": true,
    "max_allowed_memberships": 1,
    "actions": {
      "admin_delete": true
    },
    "domains": {
      "enabled": true,
      "enrollment_modes": ["manual_invitation"],
      "default_role": "string"
    },
    "slug": {
      "disabled": true
    },
    "creator_role": "string"
  },
  "fraud_settings": {
    "object": "fraud_settings",
    "native": {
      "device_attestation_mode": "disabled"
    }
  },
  "commerce_settings": {
    "billing": {
      "enabled": true,
      "stripe_publishable_key": null,
      "has_paid_user_plans": true,
      "has_paid_org_plans": true,
      "free_trial_requires_payment_method": true,
      "user": {
        "enabled": true,
        "has_paid_plans": true
      },
      "organization": {
        "enabled": true,
        "has_paid_plans": true
      }
    }
  },
  "api_keys_settings": {
    "enabled": true,
    "user_api_keys_enabled": true,
    "show_in_user_profile": true,
    "orgs_api_keys_enabled": true,
    "show_in_org_profile": true
  },
  "client_debug_mode": true,
  "maintenance_mode": true
}
```

#### Update Environment
**Endpoint:** `PATCH /v1/environment`

**Description:** Update environment using request origin

**Headers:**
- `Origin` (string, required) - The origin of the request

**Responses:**
- `200 OK` - Returns the environment (application/json)
- `400 Bad Request` - Request was not successful (application/json)

**Example Request:**
```bash
curl https://example-destined-camel-13.clerk.accounts.dev/v1/environment \
  --request PATCH \
  --header 'Origin: '
```

---

### Client

#### Client Operations
Used to interact with the Client Object.

**Endpoints:**
- `GET /v1/client`
- `PUT /v1/client`
- `POST /v1/client`
- `DELETE /v1/client`
- `GET /v1/client/handshake`

---

### Sessions

#### Session Operations
Used to interact with the sessions of a client.

**Endpoints:**
- `DELETE /v1/client/sessions`
- `GET /v1/client/sessions/{session_id}`
- `POST /v1/client/sessions/{session_id}/touch`
- `POST /v1/client/sessions/{session_id}/end`
- `POST /v1/client/sessions/{session_id}/remove`
- `POST /v1/client/sessions/{session_id}/tokens`
- `POST /v1/client/sessions/{session_id}/tokens/{template_name}`
- `POST /v1/client/sessions/{session_id}/verify`
- `POST /v1/client/sessions/{session_id}/verify/prepare_first_factor`
- `POST /v1/client/sessions/{session_id}/verify/attempt_first_factor`
- `POST /v1/client/sessions/{session_id}/verify/prepare_second_factor`
- `POST /v1/client/sessions/{session_id}/verify/attempt_second_factor`

---

### Sign Ins

#### Sign In Operations
Used to sign in a user in the current client.

**Endpoints:**
- `POST /v1/client/sign_ins`
- `GET /v1/client/sign_ins/{sign_in_id}`
- `POST /v1/client/sign_ins/{sign_in_id}/reset_password`
- `POST /v1/client/sign_ins/{sign_in_id}/prepare_first_factor`
- `POST /v1/client/sign_ins/{sign_in_id}/attempt_first_factor`
- `POST /v1/client/sign_ins/{sign_in_id}/prepare_second_factor`
- `POST /v1/client/sign_ins/{sign_in_id}/attempt_second_factor`
- `GET /v1/tickets/accept`
- `GET /v1/verify`

---

### Sign Ups

#### Sign Up Operations
Used to sign up a new user in the current client.

**Endpoints:**
- `POST /v1/client/sign_ups`
- `GET /v1/client/sign_ups/{sign_up_id}`
- `PATCH /v1/client/sign_ups/{sign_up_id}`
- `POST /v1/client/sign_ups/{sign_up_id}/prepare_verification`
- `POST /v1/client/sign_ups/{sign_up_id}/attempt_verification`

---

## User Management

### User Profile Operations
Used to interact with the properties of the current user.

**Endpoints:**
- `GET /v1/me`
- `PATCH /v1/me`
- `DELETE /v1/me`
- `POST /v1/me/tokens`
- `POST /v1/me/profile_image`
- `DELETE /v1/me/profile_image`
- `POST /v1/me/change_password`
- `POST /v1/me/remove_password`

### Active Sessions Operations
Used to interact with the sessions of the current user.

**Endpoints:**
- `GET /v1/me/sessions/active`
- `POST /v1/me/sessions/{session_id}/revoke`
- `GET /v1/me/sessions`

### Email Addresses Operations
Used to interact with the email addresses of the logged in user.

**Endpoints:**
- `GET /v1/me/email_addresses`
- `POST /v1/me/email_addresses`
- `POST /v1/me/email_addresses/{email_id}/attempt_verification`
- `POST /v1/me/email_addresses/{email_id}/prepare_verification`
- `GET /v1/me/email_addresses/{email_id}`
- `DELETE /v1/me/email_addresses/{email_id}`

### Phone Numbers Operations
Used to interact with the phone numbers of the logged in user.

**Endpoints:**
- `GET /v1/me/phone_numbers`
- `POST /v1/me/phone_numbers`
- `POST /v1/me/phone_numbers/{phone_number_id}/attempt_verification`
- `POST /v1/me/phone_numbers/{phone_number_id}/prepare_verification`
- `GET /v1/me/phone_numbers/{phone_number_id}`
- `PATCH /v1/me/phone_numbers/{phone_number_id}`
- `DELETE /v1/me/phone_numbers/{phone_number_id}`

### Web3 Wallets Operations
Used to interact with the web3 wallets of the logged in user.

**Endpoints:**
- `GET /v1/me/web3_wallets`
- `POST /v1/me/web3_wallets`
- `GET /v1/me/web3_wallets/{web3_wallet_id}`
- `DELETE /v1/me/web3_wallets/{web3_wallet_id}`
- `POST /v1/me/web3_wallets/{web3_wallet_id}/prepare_verification`
- `POST /v1/me/web3_wallets/{web3_wallet_id}/attempt_verification`

### Passkeys Operations
Used to interact with the passkeys of the logged in user.

**Endpoints:**
- `POST /v1/me/passkeys`
- `GET /v1/me/passkeys/{passkey_id}`
- `PATCH /v1/me/passkeys/{passkey_id}`
- `DELETE /v1/me/passkeys/{passkey_id}`
- `POST /v1/me/passkeys/{passkey_id}/attempt_verification`

### External Accounts Operations
Used to interact with the external accounts of the current user.

**Endpoints:**
- `POST /v1/me/external_accounts`
- `PATCH /v1/me/external_accounts/{external_account_id}/reauthorize`
- `DELETE /v1/me/external_accounts/{external_account_id}`
- `DELETE /v1/me/external_accounts/{external_account_id}/tokens`

### TOTP Operations
Used to interact with One Time Password authenticators of the current user.

**Endpoints:**
- `POST /v1/me/totp`
- `DELETE /v1/me/totp`
- `POST /v1/me/totp/attempt_verification`

### Backup Codes Operations
Used to interact with the two factor authentication backup codes of the current user.

**Endpoints:**
- `POST /v1/me/backup_codes`

---

## Organization Management

### Organization Memberships Operations
Used to interact with the current user's organization memberships, invitations and suggestions.

**Endpoints:**
- `GET /v1/me/organization_memberships`
- `DELETE /v1/me/organization_memberships/{organization_id}`
- `GET /v1/me/organization_invitations`
- `POST /v1/me/organization_invitations/{invitation_id}/accept`
- `GET /v1/me/organization_suggestions`
- `POST /v1/me/organization_suggestions/{suggestion_id}/accept`

### Organization Operations
Used to interact with an organization and its properties. The current user must be an administrator to access them.

**Endpoints:**
- `POST /v1/organizations`
- `GET /v1/organizations/{organization_id}`
- `PATCH /v1/organizations/{organization_id}`
- `DELETE /v1/organizations/{organization_id}`
- `PUT /v1/organizations/{organization_id}/logo`
- `DELETE /v1/organizations/{organization_id}/logo`

### Invitations Operations
Used to interact with the invitations of an organization. The current user must be an administrator to access them.

**Endpoints:**
- `POST /v1/organizations/{organization_id}/invitations`
- `GET /v1/organizations/{organization_id}/invitations`
- `POST /v1/organizations/{organization_id}/invitations/bulk`
- `GET /v1/organizations/{organization_id}/invitations/pending`
- `POST /v1/organizations/{organization_id}/invitations/{invitation_id}/revoke`

### Membership Requests Operations
Used to interact with the members of an organization. The current user must be an administrator to access them.

**Endpoints:**
- `GET /v1/organizations/{organization_id}/membership_requests`
- `POST /v1/organizations/{organization_id}/membership_requests/{request_id}/accept`
- `POST /v1/organizations/{organization_id}/membership_requests/{request_id}/reject`

### Members Operations
Used to interact with the members of an organization. The current user must be an administrator to access them.

**Endpoints:**
- `POST /v1/organizations/{organization_id}/memberships`
- `GET /v1/organizations/{organization_id}/memberships`
- `PATCH /v1/organizations/{organization_id}/memberships/{user_id}`
- `DELETE /v1/organizations/{organization_id}/memberships/{user_id}`

### Domains Operations
Used to interact with the members of an organization. The current user must be an administrator to access them.

**Endpoints:**
- `POST /v1/organizations/{organization_id}/domains`
- `GET /v1/organizations/{organization_id}/domains`
- `GET /v1/organizations/{organization_id}/domains/{domain_id}`
- `DELETE /v1/organizations/{organization_id}/domains/{domain_id}`
- `POST /v1/organizations/{organization_id}/domains/{domain_id}/update_enrollment_mode`
- `POST /v1/organizations/{organization_id}/domains/{domain_id}/prepare_affiliation_verification`
- `POST /v1/organizations/{organization_id}/domains/{domain_id}/attempt_affiliation_verification`

### Roles Operations
**Endpoints:**
- `GET /v1/organizations/{organization_id}/roles`

---

## Well Known Endpoints

Well-known endpoints like JWKS, deep linking, and openid-configuration.

**Endpoints:**
- `GET /.well-known/assetlinks.json`
- `GET /.well-known/jwks.json`
- `GET /.well-known/apple-app-site-association`
- `GET /.well-known/openid-configuration`
- `GET /.well-known/oauth-authorization-server`

---

## Development Tools

### DevBrowser Operations
Used to handle dev browsers.

**Endpoints:**
- `POST /v1/dev_browser`

### Health Operations
Used to get the health status of the API.

**Endpoints:**
- `GET /v1/health`

---

## OAuth2 & SAML

### OAuth2 Identity Provider Operations
Requests for the OAuth2 authorization flow.

**Endpoints:**
- `GET /oauth/authorize`
- `POST /oauth/authorize`
- `POST /oauth/register`
- `POST /oauth/token`
- `GET /oauth/userinfo`
- `POST /oauth/userinfo`
- `POST /oauth/token_info`
- `POST /oauth/token/revoke`
- `GET /v1/me/oauth/consent/{client_id}`

### OAuth2 Callbacks Operations
Used to receive callbacks from successful OAuth attempts.

**Endpoints:**
- `GET /v1/oauth_callback`
- `POST /v1/oauth_callback`

### SAML Operations
Used in authentication flows using SAML.

**Endpoints:**
- `GET /v1/saml/metadata/{saml_connection_id}.xml`
- `POST /v1/saml/acs/{saml_connection_id}`

### Waitlist Operations
Used to interact with the waitlist.

**Endpoints:**
- `POST /v1/waitlist`

---

## Data Models

### WellKnown.Assetlinks
### JWKS.ed25519.PublicKey
### JWKS.ecdsa.PublicKey
### JWKS.rsa.PublicKey
### JWKS.ed25519.PrivateKey
### JWKS.ecdsa.PrivateKey
### JWKS.rsa.PrivateKey
### JWKS.symmetric.Key
### JWKS
### ClerkError

---

*This documentation is formatted for optimal agent readability with clear structure, proper markdown formatting, and organized endpoint grouping.*