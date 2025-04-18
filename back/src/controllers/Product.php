<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\ProductModel;
use App\Utils\Route;
use App\Utils\HttpException;
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;

class Product extends Controller {
  protected object $product;

  public function __construct($param) {
    $this->product = new ProductModel();

    parent::__construct($param);
  }

  #[Route("POST", "/products", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function toto() {
    $this->product->add($this->body);

    return $this->product->getLast();
  }

  #[Route("DELETE", "/products/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function deleteProduct() {
    return $this->product->delete(intval($this->params['id']));
  }

  #[Route("GET", "/products/:id")] 
  public function getProduct() {
    return $this->product->get(intval($this->params['id']));
  }

  #[Route("GET", "/products")]
  public function getProducts() {
      $limit = isset($this->params['limit']) ? intval($this->params['limit']) : null;
      return $this->product->getAll($limit);
  }

  #[Route("PATCH", "/products/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function updateProduct() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff($this->product->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException("Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->product->update($data, intval($id));

      # Let's return the updated product
      return $this->product->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }
}
