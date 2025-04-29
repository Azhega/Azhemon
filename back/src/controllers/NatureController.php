<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\NatureModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class NatureController extends Controller {
  protected object $nature;

  public function __construct($param) {
    $this->nature = new NatureModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/nature"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createNature() {
    $this->nature->add($this->body);

    return $this->nature->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/nature/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getNature() {
    return $this->nature->get(intval($this->params['id']));
  }

  /*========================= GET BY NAME ====================================*/

  #[Route("GET", "/back/nature/name/:name"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getNatureByName() {
    return $this->nature->getByName($this->params['name']);
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/nature"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getNatures() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->nature->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/nature/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updateNature() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->nature->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->nature->update($data, intval($id));

      # Let's return the updated nature
      return $this->nature->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/nature/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deleteNature() {
    return $this->nature->delete(intval($this->params['id']));
  }
}