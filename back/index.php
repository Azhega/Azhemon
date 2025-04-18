<?php

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use back\Router;
use back\controllers\{
  AuthController,
  RoleController
};

$controllers = [
  AuthController::class,
	RoleController::class
];

$router = new Router();
$router->registerControllers($controllers);
$router->run();