import { SignJWT, jwtVerify } from 'jose';

/**
 * 이 서버가 발급하는 모든 값은 서명한 JWT 다. 저장소 없이 받은 값을 검증만 한다(PRD 5-1).
 *
 * 종류(`use`)를 반드시 넣고 검증할 때 맞춰 본다. 같은 키로 서명하므로 이것이 없으면 인가 코드를
 * access 토큰 자리에, 등록 정보(client_id)를 refresh 자리에 넣는 식으로 바꿔 쓸 수 있다.
 */

export const TOKEN_LIFETIME_SECONDS = {
  /** 로그인 화면이 들고 있는 인가 요청. 로그인 폼을 오래 열어 둘 수 있게 넉넉히 둔다. */
  authorizationRequest: 15 * 60,
  authorizationCode: 5 * 60,
  access: 60 * 60,
  refresh: 7 * 24 * 60 * 60,
} as const;

export interface ClientClaims {
  use: 'client';
  redirect_uris: string[];
  client_name?: string;
}

/** `/authorize` 가 검증을 마친 요청. 로그인 폼의 숨은 칸으로 다음 `POST /authorize` 까지 간다. */
export interface AuthorizationRequestClaims {
  use: 'authorization_request';
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  state?: string;
  scope?: string;
}

export interface AuthorizationCodeClaims {
  use: 'authorization_code';
  sub: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  scope?: string;
}

export interface AccessTokenClaims {
  use: 'access';
  sub: string;
  client_id: string;
  scope?: string;
}

export interface RefreshTokenClaims {
  use: 'refresh';
  sub: string;
  client_id: string;
  scope?: string;
}

type Claims =
  | ClientClaims
  | AuthorizationRequestClaims
  | AuthorizationCodeClaims
  | AccessTokenClaims
  | RefreshTokenClaims;

type ClaimsOf<U extends Claims['use']> = Extract<Claims, { use: U }>;

export interface SignOptions {
  issuer: string;
  /** 비우면 발급자와 같다. access 토큰은 MCP 리소스 주소를 넣는다. */
  audience?: string;
  /** 초. 비우면 만료가 없다(client_id). */
  expiresIn?: number;
}

export async function signToken(
  secret: Uint8Array,
  claims: Claims,
  options: SignOptions,
): Promise<string> {
  const { sub, ...rest } = claims as Claims & { sub?: string };
  const jwt = new SignJWT(rest)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(options.issuer)
    .setAudience(options.audience ?? options.issuer)
    .setIssuedAt()
    // 같은 초에 같은 내용으로 발급해도 값이 겹치지 않게 한다. 같은 등록 내용의 두 client_id 가 같아지면
    // 한쪽 클라이언트의 코드를 다른 쪽이 쓸 수 있다.
    .setJti(crypto.randomUUID());
  if (sub) {
    jwt.setSubject(sub);
  }
  if (options.expiresIn) {
    jwt.setExpirationTime(`${options.expiresIn}s`);
  }
  return jwt.sign(secret);
}

/** 서명·발급자·대상·만료·종류를 모두 확인한다. 하나라도 틀리면 `null`. */
export async function verifyToken<U extends Claims['use']>(
  secret: Uint8Array,
  token: string,
  use: U,
  options: { issuer: string; audience?: string },
): Promise<ClaimsOf<U> | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
      issuer: options.issuer,
      audience: options.audience ?? options.issuer,
    });
    if (payload.use !== use) {
      return null;
    }
    return payload as unknown as ClaimsOf<U>;
  } catch {
    return null;
  }
}

/** PKCE S256: `BASE64URL(SHA256(verifier)) === challenge`. */
export async function verifyPkce(verifier: string, challenge: string): Promise<boolean> {
  // RFC 7636 4.1: 43~128 자의 unreserved 문자.
  if (!/^[A-Za-z0-9\-._~]{43,128}$/.test(verifier)) {
    return false;
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return Buffer.from(digest).toString('base64url') === challenge;
}
