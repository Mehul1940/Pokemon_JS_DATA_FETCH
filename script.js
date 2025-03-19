const URL = "https://pokeapi.co/api/v2/";

class Pokemon {
  constructor(name) {
    this.name = name;
    this.data = null;
    this.speciesData = null;
    this.evolutionChainData = null;
    this.growthRateData = null;
    this.natureData = null;
    this.statsData = null;
    this.typeData = null;
    this.weaknesses = [];
    this.moves = [];
    this.typeAdvantages = [];
    this.typeDisadvantages = [];
  }

  // Fetch basic Pokémon data
  async fetchData() {
    try {
      const response = await fetch(`${URL}pokemon/${this.name}`);
      if (!response.ok) {
        throw new Error(`Pokémon not found: ${this.name}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error("Error fetching Pokémon data:", error);
      throw error;
    }
  }

  // Fetch species data (includes evolution chain URL)
  async fetchSpeciesData() {
    try {
      if (!this.data) {
        await this.fetchData();
      }
      const response = await fetch(this.data.species.url);
      if (!response.ok) {
        throw new Error(`Species data not found for: ${this.name}`);
      }
      this.speciesData = await response.json();
    } catch (error) {
      console.error("Error fetching species data:", error);
      throw error;
    }
  }

  // Fetch evolution chain data
  async fetchEvolutionChain() {
    try {
      if (!this.speciesData) {
        await this.fetchSpeciesData();
      }
      const response = await fetch(this.speciesData.evolution_chain.url);
      if (!response.ok) {
        throw new Error(`Evolution chain not found for: ${this.name}`);
      }
      this.evolutionChainData = await response.json();
    } catch (error) {
      console.error("Error fetching evolution chain:", error);
      throw error;
    }
  }

  // Fetch growth rate data
  async fetchGrowthRateData() {
    try {
      if (!this.speciesData) {
        await this.fetchSpeciesData();
      }
      const response = await fetch(this.speciesData.growth_rate.url);
      if (!response.ok) {
        throw new Error(`Growth rate data not found for: ${this.name}`);
      }
      this.growthRateData = await response.json();
    } catch (error) {
      console.error("Error fetching growth rate data:", error);
      throw error;
    }
  }

  // Fetch nature data
  async fetchNatureData() {
    try {
      const response = await fetch(`${URL}nature/`);
      if (!response.ok) {
        throw new Error(`Nature data not found`);
      }
      this.natureData = await response.json();
    } catch (error) {
      console.error("Error fetching nature data:", error);
      throw error;
    }
  }

  // Fetch stats data
  async fetchStatsData() {
    try {
      if (!this.data) {
        await this.fetchData();
      }
      this.statsData = this.data.stats;
    } catch (error) {
      console.error("Error fetching stats data:", error);
      throw error;
    }
  }

  // Fetch type data
  async fetchTypeData() {
    try {
      if (!this.data) {
        await this.fetchData();
      }
      this.typeData = this.data.types;
    } catch (error) {
      console.error("Error fetching type data:", error);
      throw error;
    }
  }

  // Fetch weaknesses
  async fetchWeaknesses() {
    try {
      if (!this.typeData) {
        await this.fetchTypeData();
      }
      const weaknesses = new Set();
      for (const type of this.typeData) {
        const response = await fetch(type.type.url);
        if (!response.ok) {
          throw new Error(`Type data not found for: ${type.type.name}`);
        }
        const typeData = await response.json();
        typeData.damage_relations.double_damage_from.forEach((weakness) => {
          weaknesses.add(weakness.name);
        });
      }
      this.weaknesses = Array.from(weaknesses);
    } catch (error) {
      console.error("Error fetching weaknesses:", error);
      throw error;
    }
  }

  // Fetch moves with levels
  async fetchMoves() {
    try {
      if (!this.data) {
        await this.fetchData();
      }
      this.moves = this.data.moves.map((move) => ({
        name: move.move.name,
        level: move.version_group_details[0]?.level_learned_at || 0,
      }));
    } catch (error) {
      console.error("Error fetching moves:", error);
      throw error;
    }
  }

  // Fetch type advantages
  async fetchTypeAdvantages() {
    try {
      if (!this.typeData) {
        await this.fetchTypeData();
      }
      const advantages = new Set();
      for (const type of this.typeData) {
        const response = await fetch(type.type.url);
        if (!response.ok) {
          throw new Error(`Type data not found for: ${type.type.name}`);
        }
        const typeData = await response.json();
        typeData.damage_relations.double_damage_to.forEach((advantage) => {
          advantages.add(advantage.name);
        });
      }
      this.typeAdvantages = Array.from(advantages);
    } catch (error) {
      console.error("Error fetching type advantages:", error);
      throw error;
    }
  }

  // Fetch type disadvantages (resistances)
  async fetchTypeDisadvantages() {
    try {
      if (!this.typeData) {
        await this.fetchTypeData();
      }
      const resistances = new Set();
      for (const type of this.typeData) {
        const response = await fetch(type.type.url);
        if (!response.ok) {
          throw new Error(`Type data not found for: ${type.type.name}`);
        }
        const typeData = await response.json();
        typeData.damage_relations.half_damage_from.forEach((resistance) => {
          resistances.add(resistance.name);
        });
      }
      this.typeDisadvantages = Array.from(resistances);
    } catch (error) {
      console.error("Error fetching type disadvantages:", error);
      throw error;
    }
  }

  // Get Pokémon name
  getName() {
    return this.data ? this.data.name : "Data not loaded";
  }

  // Get Pokémon abilities
  getAbilities() {
    return this.data
      ? this.data.abilities.map((ability) => ability.ability.name)
      : [];
  }

  // Get Pokémon evolution chain with levels
  async getEvolutionChain() {
    if (!this.evolutionChainData) {
      await this.fetchEvolutionChain();
    }
    return this._parseEvolutionChain(this.evolutionChainData.chain);
  }

  // Get Pokémon gender rate
  async getGenderRate() {
    if (!this.speciesData) {
      await this.fetchSpeciesData();
    }
    const genderRate = this.speciesData.gender_rate;
    if (genderRate === -1) {
      return "Genderless";
    } else if (genderRate === 0) {
      return "Always male";
    } else if (genderRate === 8) {
      return "Always female";
    } else {
      const femalePercentage = (genderRate / 8) * 100;
      const malePercentage = 100 - femalePercentage;
      return `${malePercentage}% male, ${femalePercentage}% female`;
    }
  }

  // Get Pokémon growth rate
  async getGrowthRate() {
    if (!this.growthRateData) {
      await this.fetchGrowthRateData();
    }
    return this.growthRateData ? this.growthRateData.name : "Unknown";
  }

  // Get Pokémon natures
  async getNatures() {
    if (!this.natureData) {
      await this.fetchNatureData();
    }
    return this.natureData
      ? this.natureData.results.map((nature) => nature.name)
      : [];
  }

  // Get Pokémon stats
  async getStats() {
    if (!this.statsData) {
      await this.fetchStatsData();
    }
    return this.statsData
      ? this.statsData.map((stat) => ({
          name: stat.stat.name,
          base_stat: stat.base_stat,
        }))
      : [];
  }

  // Get Pokémon types
  async getTypes() {
    if (!this.typeData) {
      await this.fetchTypeData();
    }
    return this.typeData ? this.typeData.map((type) => type.type.name) : [];
  }

  // Get Pokémon image URL
  getImageUrl() {
    return this.data ? this.data.sprites.front_default : "";
  }

  // Helper method to parse evolution chain with levels
  _parseEvolutionChain(chain) {
    const evolutions = [];
    let current = chain;

    while (current) {
      const evolutionEntry = {
        name: current.species.name,
        reason: "Unknown method",
      };

      if (current.evolves_to.length > 0) {
        const details = current.evolves_to[0].evolution_details[0];
        const triggerNames = {
          "level-up": "Level Up",
          trade: "Trade",
          "use-item": "Use Item",
          shed: "Party Space",
          spin: "Spin",
          other: "Special",
        };

        const trigger =
          triggerNames[details.trigger.name] || details.trigger.name;
        const conditions = [];

        if (details.min_level) conditions.push(`Level ${details.min_level}`);
        if (details.min_happiness)
          conditions.push(`Friendship ${details.min_happiness}+`);
        if (details.item)
          conditions.push(`${this._formatName(details.item.name)}`);
        if (details.held_item)
          conditions.push(`Hold ${this._formatName(details.held_item.name)}`);
        if (details.time_of_day) conditions.push(`At ${details.time_of_day}`);
        if (details.known_move_type)
          conditions.push(
            `Know ${this._formatName(details.known_move_type.name)} move`
          );
        if (details.location)
          conditions.push(`Near ${this._formatName(details.location.name)}`);
        if (details.needs_overworld_rain) conditions.push(`Raining`);
        if (details.gender)
          conditions.push(
            `Gender: ${details.gender === 1 ? "Female" : "Male"}`
          );
        if (details.relative_physical_stats !== null) {
          const stats = [
            "Attack < Defense",
            "Attack > Defense",
            "Attack = Defense",
          ];
          conditions.push(stats[details.relative_physical_stats + 1]);
        }

        evolutionEntry.reason = `${trigger}${
          conditions.length > 0 ? ` (${conditions.join(", ")})` : ""
        }`;
      }

      evolutions.push(evolutionEntry);
      current = current.evolves_to[0];
    }

    return evolutions;
  }

  // Format hyphenated names
  _formatName(str) {
    return str
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}

// UI Logic
document.getElementById("fetchData").addEventListener("click", async () => {
  const pokemonName = document
    .getElementById("pokemonName")
    .value.toLowerCase();
  if (!pokemonName) {
    alert("Please enter a Pokémon name.");
    return;
  }

  const pokemon = new Pokemon(pokemonName);

  try {
    // Show loading spinner
    document.querySelector(".loading").classList.remove("hidden");

    // Fetch all data
    await Promise.all([
      pokemon.fetchData(),
      pokemon.fetchSpeciesData(),
      pokemon.fetchEvolutionChain(),
      pokemon.fetchGrowthRateData(),
      pokemon.fetchNatureData(),
      pokemon.fetchStatsData(),
      pokemon.fetchTypeData(),
      pokemon.fetchWeaknesses(),
      pokemon.fetchMoves(),
      pokemon.fetchTypeAdvantages(),
      pokemon.fetchTypeDisadvantages(),
    ]);

    // Display Pokémon name
    document.getElementById("pokemonNameDisplay").textContent =
      pokemon.getName();

    // Display Pokémon image
    const pokemonImage = document.getElementById("pokemonImage");
    pokemonImage.src = pokemon.getImageUrl();
    pokemonImage.style.display = "block";

    // Display abilities
    const abilitiesList = document.getElementById("abilitiesList");
    abilitiesList.innerHTML = pokemon
      .getAbilities()
      .map((ability) => `<li>${ability}</li>`)
      .join("");

    // Display evolution chain with levels
    const evolutionChain = document.getElementById("evolutionChain");
    const evolutions = await pokemon.getEvolutionChain();
    evolutionChain.innerHTML = evolutions
      .map(
        (evolution) => `<li>${evolution.name} → ${evolution.reason}</li>`
      )
      .join("");

    // Display gender rate
    const genderRate = document.getElementById("genderRate");
    genderRate.textContent = await pokemon.getGenderRate();

    // Display growth rate
    const growthRate = document.getElementById("growthRate");
    growthRate.textContent = await pokemon.getGrowthRate();

    // Display natures
    const naturesList = document.getElementById("naturesList");
    const natures = await pokemon.getNatures();
    naturesList.innerHTML = natures
      .map((nature) => `<li>${nature}</li>`)
      .join("");

    // Display stats
    const statsList = document.getElementById("statsList");
    const stats = await pokemon.getStats();
    statsList.innerHTML = stats
      .map((stat) => `<li>${stat.name}: ${stat.base_stat}</li>`)
      .join("");

    // Display types
    const typesList = document.getElementById("typesList");
    const types = await pokemon.getTypes();
    typesList.innerHTML = types.map((type) => `<li>${type}</li>`).join("");

    // Display weaknesses
    const weaknessesList = document.getElementById("weaknessesList");
    weaknessesList.innerHTML = pokemon.weaknesses
      .map((weakness) => `<li>${weakness}</li>`)
      .join("");

    // Display moves with levels
    const movesList = document.getElementById("movesList");
    movesList.innerHTML = pokemon.moves
      .map((move) => `<li>${move.name} (Level ${move.level})</li>`)
      .join("");

    // Display type advantages
    const typeAdvantagesList = document.getElementById("typeAdvantagesList");
    typeAdvantagesList.innerHTML = pokemon.typeAdvantages
      .map((advantage) => `<li>${advantage}</li>`)
      .join("");

    // Display type disadvantages
    const typeDisadvantagesList = document.getElementById(
      "typeDisadvantagesList"
    );
    typeDisadvantagesList.innerHTML = pokemon.typeDisadvantages
      .map((disadvantage) => `<li>${disadvantage}</li>`)
      .join("");

    // Show the data section
    document.getElementById("pokemonData").classList.remove("hidden");

    // Hide loading spinner
    document.querySelector(".loading").classList.add("hidden");
  } catch (error) {
    console.error("Error fetching Pokémon data:", error);
    alert(
      "Failed to fetch Pokémon data. Please check the console for details."
    );

    // Hide loading spinner
    document.querySelector(".loading").classList.add("hidden");
  }
});
