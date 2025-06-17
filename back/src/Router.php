<?php

namespace back;

use back\utils\{Route, HttpException};
use back\utils\JWT;

class Router {
    protected array $routes = [];
    protected string $url;
    protected string $method;
    protected string $basePath = '/back';

    public function __construct() {
        // Parse the current request URL and method
        $requestUri = $_SERVER['REQUEST_URI'];
        $this->url = $this->removeBasePath($requestUri);
        $this->method = $_SERVER['REQUEST_METHOD'];
    }

    protected function removeBasePath($uri) {
        // Remove the base path from the URL
        if (strpos($uri, $this->basePath) === 0) {
            $uri = substr($uri, strlen($this->basePath));
        }
        
        // Also remove '/index.php' if present
        if (strpos($uri, '/index.php') === 0) {
            $uri = substr($uri, strlen('/index.php'));
        }
        
        // Remove query string if present
        if (($queryPos = strpos($uri, '?')) !== false) {
            $uri = substr($uri, 0, $queryPos);
        }
        
        // Ensure we always have at least a slash
        if (empty($uri)) {
            return '/';
        }
        
        return $uri;
    }

    /**
     * Register all controllers and their routes.
     *
     * @param array $controllers List of controller classes to register
     */
    public function registerControllers(array $controllers) {
        foreach ($controllers as $controller) {
            $reflection = new \ReflectionClass($controller);
            foreach ($reflection->getMethods() as $method) {
                $attributes = $method->getAttributes(Route::class);
                foreach ($attributes as $attribute) {
                    $instance = $attribute->newInstance();
                    // Register route with method, path, controller, and authentication requirement
                    $this->register($instance->method, $instance->path, $controller, $method->getName(), $instance->middlewares);
                }
            }
        }
    }

    /**
     * Register a single route.
     *
     * @param string $method HTTP method (GET, POST, etc.)
     * @param string $route URL pattern for the route
     * @param string $controller Controller class handling the route
     * @param string $controllerMethod Method name in the controller
     * @param bool $authRequired Whether authentication is required for this route
     */
    public function register(string $method, string $route, string $controller, string $controllerMethod, array $middlewares) {
        $this->routes[$method][$route] = [$controller, $controllerMethod, $middlewares];
    }

    /**
     * Execute the route matching the current request.
     */
    public function run() {
        $response = null;
        $request = $_REQUEST; // Initialize $request with the global $_REQUEST
        ob_start(); // Start output buffering to capture any output

        try {
            foreach ($this->routes[$this->method] as $route => $action) {
            if ($this->matchRule($this->url, $route)) {
                list($controller, $method, $middlewares) = $action;
                $pathParams = $this->extractParams($this->url, $route);

                // Execute middlewares
                foreach ($middlewares as $middlewareDefinition) {
                    // Check if middleware has arguments
                    if (is_array($middlewareDefinition)) {
                        $middlewareClass = $middlewareDefinition[0];
                        $middlewareArgs = array_slice($middlewareDefinition, 1);
                        $middleware = new $middlewareClass(...$middlewareArgs);
                    } else {
                        $middlewareClass = $middlewareDefinition;
                        $middleware = new $middlewareClass();
                    }

                    // Instead of using exit, router handles Exceptions
                    if (method_exists($middleware, 'handle')) {
                        $middleware->handle($request);
                    }
                }

                $queryParams = $_GET; // Automatically populated by PHP with query parameters
                $params = array_merge($pathParams, $queryParams, $request);
                $controllerInstance = new $controller($params);

                // Check if the method exists in the controller
                if (method_exists($controllerInstance, $method)) {
                    $response = call_user_func_array([$controllerInstance, $method], array_values($params));
                } else {
                    throw new HttpException("Method Not Allowed", 405);
                }
                break;
            }
        }

        // If no matching route was found, set the response to a "Not Found" error with a 404 status code
        if ($response === null) {
            throw new HttpException("Not Found", 404);
        }

    } catch (HttpException $e) {
        http_response_code($e->getHttpCode());
        $response = ["error" => $e->getMessage()];
    } catch (\Exception $e) {
        http_response_code(500);
        $response = ["error" => $e->getMessage()];
    }
 
    ob_end_clean(); // End output buffering and clean the buffer
    header('Content-Type: application/json');
    echo json_encode($response);
    }

    /**
     * Match the URL against the given route pattern.
     *
     * @param string $url The requested URL
     * @param string $route The route pattern to match against
     * @return bool True if the URL matches the route pattern, false otherwise
     */
    protected function matchRule($url, $route) {
        $urlParts = explode('/', trim($url, '/'));
        $routeParts = explode('/', trim($route, '/'));
        if (count($urlParts) !== count($routeParts)) {
            return false;
        }
        foreach ($routeParts as $index => $routePart) {
            if ($routePart !== $urlParts[$index] && strpos($routePart, ':') !== 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Extract parameters from the URL based on the route pattern.
     *
     * @param string $url The requested URL
     * @param string $route The route pattern with parameter placeholders
     * @return array Associative array of parameters extracted from the URL
     */
    protected function extractParams($url, $route) {
        $params = [];
        $urlParts = explode('/', trim($url, '/'));
        $routeParts = explode('/', trim($route, '/'));
        foreach ($routeParts as $index => $routePart) {
            if (strpos($routePart, ':') === 0 && isset($urlParts[$index])) {
                $paramName = substr($routePart, 1);
                $params[$paramName] = $urlParts[$index];
            }
        }
        return $params;
    }
}