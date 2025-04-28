<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\ItemModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class ItemController extends Controller {
  protected object $item;

  public function __construct($param) {
    $this->item = new ItemModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/item"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createItem() {
    $this->item->add($this->body);

    return $this->item->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/item/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getItem() {
    return $this->item->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/item"/*,
    middlewares: [AuthMiddleware::class/*, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getItems() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->item->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/item/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateItem() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->item->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->item->update($data, intval($id));

      # Let's return the updated item
      return $this->item->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/item/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteItem() {
    return $this->item->delete(intval($this->params['id']));
  }
}