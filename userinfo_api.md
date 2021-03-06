## Introduction

This API is only a single step in any event and does not include any authentication. Instead, all `payload` request parameters and return values are encoded as JWT's with a secret token of your choosing held by you (the tenant) and Toad Reader. The `idpUserId` is any unique user identifier from your system. For tenants using Shibboleth for SSO authentication with Toad Reader, the `idpUserId` must match the value of the same parameter in the Shibboleth metadata. For tenants who have opted to use Toad Reader's email login for user authentication, the `idpUserId` will be the user's email.

### Current Version: `1.0`


# Tenant REST API

## {Custom tenant endpoint base}/userinfo

### Method: GET

### Parameters:

#### `version`
```
String
```

#### `payload` (JSON encoded as JWT)
```
{
  idpUserId: String
}
```

##### Example
```json
{
  "idpUserId": "123"
}
```

### Return Value

#### On Success: `[User Info Payload]` (see below)

#### On Error (eg. idpUserId not valid): HTTP Status Code `400`

### Notes

- You choose the `{Custom tenant endpoint base}` and submit it to a Toad Reader developer for our configuration.
- Toad Reader will make this GET request after a successful user login, and then on occasion to confirm up-to-date data.

# ToadReader REST API

## {Custom ToadReader backend domain specific to tenant}/updateuserinfo

### Method: POST

### Body Parameters:

#### `version`
```
String
```

#### `payload`
```
[User Info Payload] (see below)
```

### Return Value
```
{
  success: Boolean
}
```

#### Examples
```json
{
  "success": true
}
```

### Notes

- Tenant should post to this API endpoint every time the value of anything in the `User Info Payload` changes.
- The `{Custom ToadReader backend domain specific to tenant}` can be requested from a Toad Reader developer.


# User Info Payload: (always encoded as JWT)
```
{
  idpUserId: String
  email: String
  fullname: String
  adminLevel: NONE|ADMIN (optional; default: NONE)
  forceResetLoginBefore: Integer (timestamp with ms; optional; default: no force login reset)
  books: [
    {
      id: Integer
      version: BASE|ENHANCED|PUBLISHER|INSTRUCTOR (optional; default: BASE)
      expiration: Integer (timestamp with ms; optional: default: no expiration)
      enhancedToolsExpiration: Integer (timestamp with ms; optional; default=expiration)
      flags: [String] (optional; default: [])
    }
  ]
  subscriptions: [
    {
      id: Integer
      expiration: Integer (timestamp with ms; optional: default: no expiration)
      enhancedToolsExpiration: Integer (timestamp with ms; optional; default=expiration)
    }
  ]
}
```

### Example
```json
{
  "idpUserId": "123",
  "email": "user@email.com",
  "fullname": "Mr. User",
  "adminLevel": "ADMIN",
  "forceResetLoginBefore": 1569921868835,
  "books": [
    {
      "id": 234,
      "version": "INSTRUCTOR",
      "expiration": 1601457944751,
      "enhancedToolsExpiration": 1613121954486,
      "flags": ["trial"]
    }
  ],
  "subscriptions": [
    {
      "id": 2,
      "expiration": 1601457944751,
      "enhancedToolsExpiration": 1613121954486
    }
  ],
}
```