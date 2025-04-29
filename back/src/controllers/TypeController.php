<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\TypeModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class TypeController extends Controller {
  protected object $type;

  public function __construct($param) {
    $this->type = new TypeModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/type"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createType() {
    $this->type->add($this->body);

    return $this->type->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/type/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getType() {
    return $this->type->get(intval($this->params['id']));
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/type/name/:name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTypeByName() {
    return $this->type->getByName($this->params['name']);
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/type"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getTypes() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->type->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/type/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateType() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->type->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->type->update($data, intval($id));

      # Let's return the updated type
      return $this->type->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/type/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteType() {
    return $this->type->delete(intval($this->params['id']));
  }
}