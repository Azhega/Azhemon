<?php

namespace back\utils;

#[\Attribute]
class Route {
    public string $method;
    public string $path;
    public array $middlewares;

    public function __construct(string $method, string $path, array $middlewares = []) {
        $this->method = strtoupper($method);
        $this->path = $path;
        $this->middlewares = $middlewares;
    }
}