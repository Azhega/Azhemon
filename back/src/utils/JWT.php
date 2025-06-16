<?php

namespace back\utils;

use Exception;

class JWT {
  private static $secret;
  private static $algorithm = 'HS256';
  private static $issuer;
  private static $audience;

  public static function initialize($secret, $issuer = null, $audience = null) {  
    self::$secret = $secret;
    self::$issuer = $issuer;
    self::$audience = $audience;
  }

  public static function generate($payload) {

    $header = self::base64UrlEncode(json_encode([
      'alg' => self::$algorithm,
      'typ' => 'JWT'
    ]));

    $payloadEncoded = self::base64UrlEncode(json_encode($payload));
    
    $concatSignature = "$header.$payloadEncoded";
    $signature = hash_hmac("sha256", $concatSignature, self::$secret, true);
    $signatureEncoded = self::base64UrlEncode($signature);

    return "$header.$payloadEncoded.$signatureEncoded";
  }

  public static function verify($jwt) {
    // Ensure the JWT has the correct number of segments
    $segments = explode('.', $jwt);
    if (count($segments) !== 3) {
      throw new Exception('Invalid JWT structure.');
    }

    list($headerEncoded, $payloadEncoded, $signatureProvided) = $segments;
    $header = json_decode(self::base64UrlDecode($headerEncoded), true);
    $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

    $signatureProvided = self::base64UrlDecode($signatureProvided);
    $signatureExpected = hash_hmac(
      'sha256', 
      "$headerEncoded.$payloadEncoded", 
      self::$secret, 
      true
    );

    // Verify the signature
    if (!hash_equals($signatureExpected, $signatureProvided)) {
      throw new Exception('Invalid signature.');
    }

    // Verify the 'exp' claim if it exists
    if (isset($payload['exp']) && time() >= $payload['exp']) {
      throw new Exception('Token has expired.');
    }

    if (isset($payload['iss']) 
    && self::$issuer !== null 
    && $payload['iss'] !== self::$issuer) {
      throw new Exception('Invalid issuer.');
    }

    if (isset($payload['aud']) 
    && self::$audience !== null 
    && $payload['aud'] !== self::$audience) {
      throw new Exception('Invalid audience.');
    }

    // Token blacklist checking done in the middleware since it
    // requires database access and JWT should remain stateless

    // Token is valid; return the payload
    return $payload;
  }

  private static function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
  }


  private static function base64UrlDecode($data) {
      $padding = 4 - (strlen($data) % 4);
      if ($padding !== 4) {
          $data .= str_repeat('=', $padding);
      }
      return base64_decode(strtr($data, '-_', '+/'));
  }

}