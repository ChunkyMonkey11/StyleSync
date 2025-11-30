@AGENTS.md

---
title: Network requests
description: >
  Shop Minis can only make network requests to approved domains. This page
  describes how to add trusted domains and how to perform fetch requests inside
  your Mini.
api_name: shop-minis
source_url:
  html: 'https://shopify.dev/docs/api/shop-minis/network-requests'
  md: 'https://shopify.dev/docs/api/shop-minis/network-requests.md'
---

# Network requests

Shop Minis can only make network requests to approved domains. This page describes how to add trusted domains and how to perform fetch requests inside your Mini.

***

## Trusted domains

To allow your Mini to make network requests to external domains, you need to add them to the `trusted_domains` array in your `manifest.json` file. This will be reviewed when your Mini is submitted.

## Adding trusted domains to manifest.json

```json
{
  "name": "My Mini",
  "trusted_domains": ["example.com", "api.example.com"]
}
```

***

## Making requests

Once you have added trusted domains to your manifest, you can use standard fetch requests in your Mini to communicate with your backend services. See [Custom backend](https://shopify.dev/docs/api/shop-minis/custom-backend) for more information on how to verify requests.

Make sure to handle errors appropriately and provide feedback to users when requests fail.

Authenticating requests

Do not include secret tokens or API keys in your Mini code. If you need to make authenticated API requests, you should wrap or proxy the request on your own backend using the verification process for rate limiting.

***

## Handling CORS

Any backend services that your Shop Mini communicates with must be configured to allow [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) requests from `localhost:*` (all localhost ports).

This applies to both development and production environments, as Shop Minis use this origin to make requests. Ensure your server includes appropriate CORS headers to allow requests from these origins.

***


Minis Admin API
The Shop Minis Admin API is a GraphQL API that allows you to manage your Mini from a backend application. It includes mutations for enabling/disabling your Mini, verifying user requests, and more.

Authentication
Shop Minis Admin API requests are authenticated using an API key. Your API key will be generated when you first run the setup command. You can find it in your project's .env file.

Perform a GraphQL request
curl -X POST \
  https://server.shop.app/minis/admin-api/alpha/graphql.json \
  -H 'Content-Type: application/graphql' \
  -H 'Authorization: Bearer <shop-minis-admin-api-key>' \
  -d '{your_query}'


Mutations

---
title: userTokenVerify
description: >-
  Verifies a user token. See [Verifying
  requests](/docs/api/shop-minis/network-requests#verifying-requests) for more
  details.
api_name: shop-minis
source_url:
  html: >-
    https://shopify.dev/docs/api/shop-minis/minis-admin-api/mutations/usertokenverify
  md: >-
    https://shopify.dev/docs/api/shop-minis/minis-admin-api/mutations/usertokenverify.md
---

# user​Token​Verifymutation

Verifies a user token. See [Verifying requests](https://shopify.dev/docs/api/shop-minis/network-requests#verifying-requests) for more details.

## Input

Input arguments for the mutation.

* token

  string

  required

  The temporary user token to verify.

## Return type

This mutation returns a `UserTokenVerifyPayload` object with the following fields:

* userErrors

  UserTokenVerifyUserError\[]

  required

  List of errors that occured while executing the mutation.

* publicId

  string | null

  The public ID of the user.

* tokenExpiresAt

  ISO8601DateTime | null

  The expiration date of the token.

* userState

  'VERIFIED' | 'GUEST' | null

  The state of the user.

* userIdentifier

  string | null

  deprecated

  A permanent identifier for the user.

  Deprecated

  Use publicId instead.

### ISO8601DateTime

```ts
string
```

### UserTokenVerifyUserError

* code

  Error code associated with the error.

  ```ts
  | 'TOKEN_INVALID'
      | 'TOKEN_EXPIRED'
      | 'INVALID_MINI'
      | 'USER_NOT_FOUND'
  ```

* field

  Which input value this error came from.

  ```ts
  string[]
  ```

* message

  A description of the error.

  ```ts
  string
  ```

```ts
export interface UserTokenVerifyUserError {
  /**
   * Error code associated with the error.
   */
  readonly code:
    | 'TOKEN_INVALID'
    | 'TOKEN_EXPIRED'
    | 'INVALID_MINI'
    | 'USER_NOT_FOUND'

  /**
   * Which input value this error came from.
   */
  readonly field?: (string | null)[]

  /**
   * A description of the error.
   */
  readonly message: string
}
```


UseGenerateUserToken 

---
title: useGenerateUserToken
description: >-
  The `useGenerateUserToken` hook generates a temporary token for authenticating
  the current user with your backend. This token can be verified using the
  [`userTokenVerify`](/docs/api/shop-minis/minis-admin-api/mutations/usertokenverify)
  mutation to obtain a permanent user identifier. See [Verifying
  requests](/docs/api/shop-minis/network-requests#verifying-requests) for
  implementation details.


  > Note: Some common use cases are: authenticating API requests to your
  backend, identifying users for personalized experiences, securely linking Shop
  users to your application's user database.

  <!-- SCOPE_REQUIREMENTS_START -->


  > Caution: This hook requires adding the following scopes to the manifest
  file:

  >

  > `openid`

  >

  > For more details, see [manifest.json](/docs/api/shop-minis/manifest-file).

  <!-- SCOPE_REQUIREMENTS_END -->
api_name: shop-minis
source_url:
  html: 'https://shopify.dev/docs/api/shop-minis/hooks/user/usegenerateusertoken'
  md: 'https://shopify.dev/docs/api/shop-minis/hooks/user/usegenerateusertoken.md'
---

# use​Generate​User​Tokenhook

The `useGenerateUserToken` hook generates a temporary token for authenticating the current user with your backend. This token can be verified using the [`userTokenVerify`](https://shopify.dev/docs/api/shop-minis/minis-admin-api/mutations/usertokenverify) mutation to obtain a permanent user identifier. See [Verifying requests](https://shopify.dev/docs/api/shop-minis/network-requests#verifying-requests) for implementation details.

Note

Some common use cases are: authenticating API requests to your backend, identifying users for personalized experiences, securely linking Shop users to your application's user database.

Caution

This hook requires adding the following scopes to the manifest file:

`openid`

For more details, see [manifest.json](https://shopify.dev/docs/api/shop-minis/manifest-file).

## use​Generate​User​Token()

### Returns

* UseGenerateUserTokenReturns

  ### UseGenerateUserTokenReturns

  * generateUserToken

    () => Promise<{ data: GeneratedTokenData; userErrors?: UserTokenGenerateUserErrors\[]; }>

    Generates a temporary token for the user. Tokens are cached in memory and reused if still valid (with a 5-minute expiry buffer). A new token is automatically generated when the cached token is expired or missing.

### UseGenerateUserTokenReturns

* generateUserToken

  Generates a temporary token for the user. Tokens are cached in memory and reused if still valid (with a 5-minute expiry buffer). A new token is automatically generated when the cached token is expired or missing.

  ```ts
  () => Promise<{ data: GeneratedTokenData; userErrors?: UserTokenGenerateUserErrors[]; }>
  ```

```ts
interface UseGenerateUserTokenReturns {
  /**
   * Generates a temporary token for the user.
   * Tokens are cached in memory and reused if still valid (with a 5-minute expiry buffer).
   * A new token is automatically generated when the cached token is expired or missing.
   */
  generateUserToken: () => Promise<{
    data: GeneratedTokenData
    userErrors?: UserTokenGenerateUserErrors[]
  }>
}
```

### GeneratedTokenData

* expiresAt

  The expiration time of the token.

  ```ts
  ISO8601DateTime | null
  ```

* token

  A temporary token for the user.

  ```ts
  string | null
  ```

* userState

  Whether the user is verified or a guest.

  ```ts
  UserState | null
  ```

```ts
export interface GeneratedTokenData {
  /**
   * A temporary token for the user.
   */
  token?: string | null
  /**
   * The expiration time of the token.
   */
  expiresAt?: ISO8601DateTime | null
  /**
   * Whether the user is verified or a guest.
   */
  userState?: UserState | null
}
```

### ISO8601DateTime

```ts
string
```

### UserState

* GUEST

  ```ts
  GUEST
  ```

* VERIFIED

  ```ts
  VERIFIED
  ```

```ts
export enum UserState {
  GUEST = 'GUEST',
  VERIFIED = 'VERIFIED',
}
```

### UserTokenGenerateUserErrors

* code

  ```ts
  UserTokenGenerateUserErrorCode
  ```

* field

  ```ts
  string[] | null
  ```

* message

  ```ts
  string
  ```

```ts
export interface UserTokenGenerateUserErrors {
  code: UserTokenGenerateUserErrorCode
  message: string
  field?: string[] | null
}
```

### UserTokenGenerateUserErrorCode

* MINI\_NOT\_FOUND

  ```ts
  MINI_NOT_FOUND
  ```

* USER\_NOT\_FOUND

  ```ts
  USER_NOT_FOUND
  ```

```ts
export enum UserTokenGenerateUserErrorCode {
  MINI_NOT_FOUND = 'MINI_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
}
```