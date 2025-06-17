<?php

require 'vendor/autoload.php';
require_once __DIR__ . '/src/models/SqlConnect.php';
require_once __DIR__ . '/src/utils/JWT.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use back\Router;
use back\controllers\{
  AuthController,
  RoleController,
  PlayerController,
  TeamController,
  TeamPokemonController,
  TeamPokemonMoveController
};

$controllers = [
  AuthController::class,
	RoleController::class,
  PlayerController::class,
  TeamController::class,
  TeamPokemonController::class,
  TeamPokemonMoveController::class
];

$router = new Router();
$router->registerControllers($controllers);
$router->run();