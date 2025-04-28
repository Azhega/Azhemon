<?php

namespace back\controllers;

use back\controllers\Controller;
use back\models\PokemonSpeciesModel;
use back\utils\Route;
use back\utils\{HttpException};
use back\middlewares\{AuthMiddleware,RoleMiddleware};

class PokemonSpeciesController extends Controller {
  protected object $pokemonSpecies;

  public function __construct($param) {
    $this->pokemonSpecies = new PokemonSpeciesModel();

    parent::__construct($param);
  }

    /*========================= POST ========================================*/

  #[Route("POST", "/back/pokemon_species"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function createPokemonSpecies() {
    $this->pokemonSpecies->add($this->body);

    return $this->pokemonSpecies->getLast();
  }

  /*========================= GET BY ID =====================================*/

  #[Route("GET", "/back/pokemon_species/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getPokemonSpecies() {
    return $this->pokemonSpecies->get(intval($this->params['id']));
  }

  /*========================= GET ALL =======================================*/

  #[Route("GET", "/back/pokemon_species"/*,
    middlewares: [AuthMiddleware::class/*, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function getPokemonSpeciess() {
      $limit = isset($this->params['limit']) ? 
        intval($this->params['limit']) : null;
      return $this->pokemonSpecies->getAll($limit);
  }

  /*========================= PATCH =========================================*/

  #[Route("PATCH", "/back/pokemon_species/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function updatePokemonSpecies() {
    try {
      $id = intval($this->params['id']);
      $data = $this->body;

      # Check if the data is empty
      if (empty($data)) {
        throw new HttpException("Missing parameters for the update.", 400);
      }

      # Check for missing fields
      $missingFields = array_diff(
        $this->pokemonSpecies->authorized_fields_to_update, array_keys($data));
      if (!empty($missingFields)) {
        throw new HttpException(
          "Missing fields: " . implode(", ", $missingFields), 400);
      }

      $this->pokemonSpecies->update($data, intval($id));

      # Let's return the updated pokemonSpecies
      return $this->pokemonSpecies->get($id);
    } catch (HttpException $e) {
      throw $e;
    }
  }

  /*========================= DELETE ========================================*/

  #[Route("DELETE", "/back/pokemon_species/:id"/*,
    middlewares: [AuthMiddleware::class, 
    [RoleMiddleware::class, Roles::ROLE_ADMIN]]*/)]
  public function deletePokemonSpecies() {
    return $this->pokemonSpecies->delete(intval($this->params['id']));
  }
}