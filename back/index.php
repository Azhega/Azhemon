<?php

require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use back\Router;
use back\controllers\{RoleController/*, User, Auth, Product, Sale, Order, OrderItem, Delivery, Returns*/};

$controllers = [
    RoleController::class/*,
    User::class,
    Auth::class,
    Product::class,
    Sale::class,
    Order::class,
    OrderItem::class,
    Delivery::class,
    Returns::class*/
];

$router = new Router();
$router->registerControllers($controllers);
$router->run();