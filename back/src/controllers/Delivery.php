<?php

namespace App\Controllers;

use App\Controllers\Controller;
use App\Models\DeliveryModel;
use App\Utils\{Route,HttpException};
use App\Middlewares\AuthMiddleware;
use App\Middlewares\RoleMiddleware;

class Delivery extends Controller {
  protected object $delivery;

  public function __construct($param) {
    $this->delivery = new DeliveryModel();

    parent::__construct($param);
  }

  #[Route("POST", "/deliveries", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function toto() {
    $this->delivery->add($this->body);

    return $this->delivery->getLast();
  }

  #[Route("DELETE", "/deliveries/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function deleteDelivery() {
    return $this->delivery->delete(intval($this->params['id']));
  }

  #[Route("GET", "/deliveries/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])] 
  public function getDelivery() {
    return $this->delivery->get(intval($this->params['id']));
  }

  #[Route("GET", "/deliveries", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getDeliveries() {
      $limit = isset($this->params['limit']) ? intval($this->params['limit']) : null;
      return $this->delivery->getAll($limit);
  }

  #[Route("PATCH", "/deliveries/:id", middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function updateDelivery() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff($this->delivery->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException("Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->delivery->update($data, intval($id));

      # Let's return the updated delivery
      return $this->delivery->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }
}
