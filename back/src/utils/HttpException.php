<?php

namespace back\utils;

use Exception;

class HttpException extends Exception {
    const HTTP_BAD_REQUEST = 400;
    const HTTP_UNAUTHORIZED = 401;
    const HTTP_FORBIDDEN = 403;
    const HTTP_NOT_FOUND = 404;
    const HTTP_METHOD_NOT_ALLOWED = 405;
    const HTTP_INTERNAL_SERVER_ERROR = 500;

    protected $httpCode;

    public function __construct($message, $httpCode, $code = 0, Exception $previous = null) {
        $this->httpCode = $httpCode;
        parent::__construct($message, $code, $previous);
    }

    public function getHttpCode() {
        return $this->httpCode;
    }
}