import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';


interface PokemonListItem {
  name: string;
  url: string;
  imageUrl: string;
  types?: string[];
}

interface PokemonDetails {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      "official-artwork": {
        front_default: string;
      };
    };
  };
  types: {
    type: {
      name: string;
    };
  }[];
  abilities: {
    ability: {
      name: string;
    };
    is_hidden: boolean;
  }[];
  height: number;
  weight: number;
}


const getPokemonIdFromUrl = (url: string): string => {
  const matches = url.match(/\/(\d+)\/$/);
  return matches ? matches[1] : '';
};

interface PokemonDetailProps {
  allPokemon: PokemonListItem[];
}

const PokemonDetail: React.FC<PokemonDetailProps> = ({ allPokemon }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [details, setDetails] = useState<PokemonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentPokemonId = parseInt(id || '1');
  const pokemonUrl = `https://pokeapi.co/api/v2/pokemon/${currentPokemonId}`;

  const currentIndex = allPokemon.findIndex(pokemon => {
    const pokemonId = parseInt(getPokemonIdFromUrl(pokemon.url));
    return pokemonId === currentPokemonId;
  });

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < allPokemon.length - 1;

  const handlePrevious = () => {
    if (canGoPrevious) {
      const prevPokemon = allPokemon[currentIndex - 1];
      const prevId = getPokemonIdFromUrl(prevPokemon.url);
      navigate(`/pokemon/${prevId}`);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      const nextPokemon = allPokemon[currentIndex + 1];
      const nextId = getPokemonIdFromUrl(nextPokemon.url);
      navigate(`/pokemon/${nextId}`);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get<PokemonDetails>(pokemonUrl);
        setDetails(response.data);
      } catch (err) {
        setError("Could not load Pokémon data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [pokemonUrl]);

  if (isLoading) return <div className="loading-details">Loading details...</div>;
  if (error) return <div className="error">{error} <button onClick={handleBack}>Go Back</button></div>;
  if (!details) return null;

  return (
    <div className="pokemon-detail-container">
      <div className="detail-navigation">
        <button onClick={handleBack} className="back-button">← Back to Search</button>
        <div className="nav-buttons">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="nav-button prev-button"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="nav-button next-button"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="pokemon-card">
        <img
          src={details.sprites.other['official-artwork'].front_default || details.sprites.front_default}
          alt={details.name}
          className="pokemon-image"
        />
        <h1 className="pokemon-name">{details.name} (#{details.id})</h1>
        <div className="pokemon-info">
          <p><strong>Height:</strong> {details.height / 10} m</p>
          <p><strong>Weight:</strong> {details.weight / 10} kg</p>
        </div>
        <div className="pokemon-attributes">
          <div>
            <h3>Types</h3>
            <ul>
              {details.types.map(t => <li key={t.type.name}>{t.type.name}</li>)}
            </ul>
          </div>
          <div>
            <h3>Abilities</h3>
            <ul>
              {details.abilities.map(a => <li key={a.ability.name}>{a.ability.name}{a.is_hidden && ' (Hidden)'}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


interface PokemonSearchPageProps {
  allPokemon: PokemonListItem[];
  isLoading: boolean;
  error: string | null;
}

const PokemonSearchPage: React.FC<PokemonSearchPageProps> = ({ allPokemon, isLoading, error }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<'id' | 'name'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'gallery'>('list');
  const [selectedType, setSelectedType] = useState<string>('');

  const pokemonTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison',
    'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ];


  const searchResults = useMemo(() => {
    if (viewMode !== 'list' || !searchQuery) return [];

    const filtered = allPokemon
      .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'id') {
        const idA = parseInt(getPokemonIdFromUrl(a.url));
        const idB = parseInt(getPokemonIdFromUrl(b.url));
        comparison = idA - idB;
      } else {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allPokemon, searchQuery, sortKey, sortOrder, viewMode]);
  const galleryResults = useMemo(() => {
    if (viewMode !== 'gallery') return [];

    let results = allPokemon;

    if (searchQuery) {
      results = results.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (selectedType) {
      results = results.filter(p => p.types && p.types.includes(selectedType));
    }



    return [...results].sort((a, b) => {
      let comparison = 0;
      if (sortKey === 'id') {
        const idA = parseInt(getPokemonIdFromUrl(a.url));
        const idB = parseInt(getPokemonIdFromUrl(b.url));
        comparison = idA - idB;
      } else {
        comparison = a.name.localeCompare(b.name);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  }, [allPokemon, searchQuery, sortKey, sortOrder, viewMode, selectedType]);

  const handleSelectPokemon = (url: string) => {
    const pokemonId = getPokemonIdFromUrl(url);
    navigate(`/pokemon/${pokemonId}`);
  };

  return (
    <div className="app-container">
      <header>
        <h1>Pokémon  Search</h1>
        <p>Find your favorite Pokémon</p>
      </header>
      <main>
        <div className="search-wrapper">
          <div className="view-controls">
            <button
              className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              className={`view-toggle ${viewMode === 'gallery' ? 'active' : ''}`}
              onClick={() => setViewMode('gallery')}
            >
              Gallery View
            </button>
          </div>

          <input
            type="text"
            className="search-bar"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
            placeholder="Search for a Pokémon..."
          />

          <div className="controls-row">
            {(searchQuery || viewMode === 'gallery') && (
              <div className="sort-controls">
                <label>
                  Sort by:
                  <select value={sortKey} onChange={(e) => setSortKey(e.target.value as 'id' | 'name')}>
                    <option value="id">ID</option>
                    <option value="name">Name</option>
                  </select>
                </label>
                <label>
                  Order:
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
                    <option value="asc">Ascending</option>
                    <option value="desc">Descending</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          {isLoading && <div className="loading-initial">Loading Pokémon database...</div>}
          {error && <div className="error">{error}</div>}

          {viewMode === 'list' && searchQuery && searchResults.length > 0 && (
            <ul className="search-results">
              {searchResults.map((pokemon) => {
                const pokemonId = getPokemonIdFromUrl(pokemon.url);
                return (
                  <div key={pokemon.name}>
                    <li onClick={() => handleSelectPokemon(pokemon.url)}>
                      <span className="pokemon-id">#{pokemonId}</span>
                      <span className="pokemon-name">{pokemon.name}</span>
                      <img src={pokemon.imageUrl} alt={pokemon.name} className="result-sprite" />
                    </li>
                  </div>
                );
              })}
            </ul>
          )}

          {viewMode === 'gallery' && !isLoading && (
            <div className="gallery-container">
              <div className="type-filters">
                <button
                  className={`type-filter ${selectedType === '' ? 'active' : ''}`}
                  onClick={() => setSelectedType('')}
                >
                  All Types
                </button>
                {pokemonTypes.map(type => (
                  <button
                    key={type}
                    className={`type-filter ${selectedType === type ? 'active' : ''}`}
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {galleryResults.length > 0 ? (
                <div className="pokemon-gallery">
                  {galleryResults.map((pokemon) => {
                    const pokemonId = getPokemonIdFromUrl(pokemon.url);
                    return (
                      <div
                        key={pokemon.name}
                        className="gallery-card"
                        onClick={() => handleSelectPokemon(pokemon.url)}
                      >
                        <img
                          src={pokemon.imageUrl}
                          alt={pokemon.name}
                          className="gallery-image"
                        />
                        <div className="gallery-info">
                          <span className="gallery-id">#{pokemonId}</span>
                          <span className="gallery-name">{pokemon.name}</span>
                          {pokemon.types && (
                            <div className="gallery-types">
                              {pokemon.types.map(type => (
                                <span key={type} className={`type-badge ${type}`}>
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-results">No Pokémon found in gallery.</div>
              )}
            </div>
          )}

          {viewMode === 'list' && searchQuery && searchResults.length === 0 && !isLoading && (
            <div className="no-results">No Pokémon found.</div>
          )}

          {viewMode === 'list' && !searchQuery && !isLoading && (
            <div className="search-prompt">Start typing to search for Pokémon, or switch to Gallery View to browse.</div>
          )}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const [allPokemon, setAllPokemon] = useState<PokemonListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPokemonList = async () => {
      try {
        const response = await axios.get<{ results: { name: string; url: string }[] }>('https://pokeapi.co/api/v2/pokemon?limit=151');

        const pokemonWithTypes = await Promise.all(
          response.data.results.map(async (pokemon: { name: string; url: string }) => {
            const id = getPokemonIdFromUrl(pokemon.url);
            const imageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

            try {
              const detailResponse = await axios.get<PokemonDetails>(pokemon.url);
              const types = detailResponse.data.types.map(t => t.type.name);
              return { ...pokemon, id, imageUrl, types };
            } catch {
              return { ...pokemon, id, imageUrl };
            }
          })
        );

        setAllPokemon(pokemonWithTypes);
      } catch (err) {
        setError('Failed to load Pokémon list. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPokemonList();
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PokemonSearchPage
            allPokemon={allPokemon}
            isLoading={isLoading}
            error={error}
          />
        }
      />
      <Route
        path="/pokemon/:id"
        element={<PokemonDetail allPokemon={allPokemon} />}
      />
    </Routes>
  );
};

export default App;
