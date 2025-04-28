<?php

require 'vendor/autoload.php';
require_once 'C:\laragon\www\Azhemon\back\src\models\SqlConnect.php';
require_once 'C:\laragon\www\Azhemon\back\src\utils\JWT.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use back\utils\JWT;
use back\models\SqlConnect;
use back\Router;
use back\controllers\{
  AuthController,
  RoleController,
  PlayerController,
  MoveCategoryController,
  TypeController,
  NatureController,
  AbilityController,
  ItemController
};

$sqlConnect = new SqlConnect();
$db = $sqlConnect->db;

JWT::setDB($db);

$controllers = [
  AuthController::class,
	RoleController::class,
  PlayerController::class,
  MoveCategoryController::class,
  TypeController::class,
  NatureController::class,
  AbilityController::class,
  ItemController::class
];

$router = new Router();
$router->registerControllers($controllers);
$router->run();