<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\RoleModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class RoleController extends Controller {
  protected object $role;

  public function __construct($param) {
    $this->role = new RoleModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/role",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function createRole() {
    $this->role->add($this->body);

    return $this->role->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/role/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getRole() {
    return $this->role->get(intval($this->params['id']));
  }

  /*========================= GET BY NAME ====================================*/

  #[Route("GET", "/role/name/:name",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getRoleCategoryByName() {
    return $this->role->getByName($this->params['name']);
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/role",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function getRoles() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->role->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/role/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function updateRole() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->role->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->role->update($data, intval($id));

      # Let's return the updated role
      return $this->role->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/role/:id",
    middlewares: [AuthMiddleware::class, [RoleMiddleware::class, 'admin']])]
  public function deleteRole() {
    return $this->role->delete(intval($this->params['id']));
  }
}