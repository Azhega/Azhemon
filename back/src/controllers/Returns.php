<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\ReturnModel;
use App\Utils\{Route,HttpException};
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;

class Returns extends Controller {
  protected object $return;

  public function __construct($param) {
    $this->return = new ReturnModel();

    parent::__construct($param);
  }

  #[Route("POST", "/returns", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function toto() {
    $this->return->add($this->body);

    return $this->return->getLast();
  }

  #[Route("DELETE", "/returns/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function deleteReturn() {
    return $this->return->delete(intval($this->params['id']));
  }

  #[Route("GET", "/returns/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])] 
  public function getReturn() {
    return $this->return->get(intval($this->params['id']));
  }

  #[Route("GET", "/returns", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getReturns() {
      $limit = isset($this->params['limit']) ? intval($this->params['limit']) : null;
      return $this->return->getAll($limit);
  }

  #[Route("PATCH", "/returns/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function updateReturn() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff($this->return->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException("Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->return->update($data, intval($id));

      # Let's return the updated return
      return $this->return->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }
}
