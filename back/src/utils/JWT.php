<?php

namespace back\utils;

class JWT {
  private static $secret;

  public static function initialize() {  
      self::$secret = getenv('JWT_SECRET') ?: null; //To secure secret
      var_dump("initialize : " . self::$secret);
  }

  public static function generate($payload) {
    // Base 64
      // Header
    $header = self::base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    // Payload
    $payload = self::base64UrlEncode(json_encode($payload));
    
    // Concaténation header . payload
    $concat_signature = "$header.$payload";
    // Génération de la signature avec hash
    $signature = hash_hmac("sha256", $concat_signature, self::$secret, true);
      //  base64 de la signature
    $signature = self::base64UrlEncode($signature);

    // Return -> header . payload . signature
    return "$header.$payload.$signature";
  }

  public static function verify($jwt) {
    // Ensure the JWT has the correct number of segments
    $segments = explode('.', $jwt);
    if (count($segments) !== 3) {
        return false;  // Invalid JWT structure
    }

    list($headerEncoded, $payloadEncoded, $signatureProvided) = $segments;
    $header = json_decode(self::base64UrlDecode($headerEncoded), true);
    $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

    var_dump("verify secret : " . self::$secret);

    $signatureProvided = self::base64UrlDecode($signatureProvided);
    $signatureExpected = hash_hmac('sha256', "$headerEncoded.$payloadEncoded", self::$secret, true);

    // Verify the signature
    if (!hash_equals($signatureExpected, $signatureProvided)) {
        return false;
    }

    // Verify the 'exp' claim if it exists
    if (isset($payload['exp']) && time() >= $payload['exp']) {
        return false;  // Token has expired
    }

    // Token is valid; return the payload
    return $payload;
  }

  private static function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), characters: '=');
  }


  private static function base64UrlDecode($data) {
      $padding = 4 - (strlen($data) % 4);
      if ($padding !== 4) {
          $data .= str_repeat('=', $padding);
      }
      return base64_decode(strtr($data, '-_', '+/'));
  }

}