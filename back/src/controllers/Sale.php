<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\SaleModel;
use App\Utils\{Route,HttpException};
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;

class Sale extends Controller {
  protected object $sale;

  public function __construct($param) {
    $this->sale = new SaleModel();

    parent::__construct($param);
  }

  #[Route("POST", "/sales", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function toto() {
    $this->sale->add($this->body);
    return $this->sale->getLast();
  }

  #[Route("DELETE", "/sales/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function deleteSale() {
    return $this->sale->deleteSale(intval($this->params['id']));
  }

  #[Route("GET", "/sales/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])] 
  public function getSale() {
    return $this->sale->getSale(intval($this->params['id']));
  }

  #[Route("GET", "/sales", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getSales() {
      $limit = isset($this->params['limit']) ? intval($this->params['limit']) : null;
      return $this->sale->getAll($limit);
  }

  #[Route("PATCH", "/sales/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function updateSale() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff($this->sale->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException("Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->sale->updateSale($data, intval($id));

      # Let's return the updated sale
      return $this->sale->getSale($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }
}
