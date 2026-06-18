import { useEffect, useMemo, useState, type CSSProperties } from 'react';

type Genre =
  | 'Adventure'
  | 'Comedy'
  | 'Documentary'
  | 'Drama'
  | 'Family'
  | 'Fantasy'
  | 'Mystery'
  | 'Romance'
  | 'Sci-Fi'
  | 'Thriller';

type SortBy = 'trending' | 'rating' | 'year' | 'title';
type ViewMode = 'Discover' | 'Favorites';
type Tone = 'accent' | 'success' | 'warning' | 'neutral';

type Movie = {
  id: string;
  title: string;
  genre: Genre;
  year: number;
  rating: number;
  runtime: number;
  director: string;
  cast: string[];
  synopsis: string;
  mood: string;
  accent: string;
  rank: number;
  banner?: string;
};

type RemoteFilm = {
  id?: string;
  title?: string;
  release_date?: string;
  rt_score?: string;
  running_time?: string;
  director?: string;
  producer?: string;
  description?: string;
  movie_banner?: string;
  image?: string;
};

type SortOption = {
  value: SortBy;
  label: string;
};

const FAVORITES_KEY = 'moviehub-favorites';
const GHIBLI_API_URL = 'https://ghibliapi.vercel.app/films';

const MOVIES: Movie[] = [
  {
    id: 'm-1',
    title: 'Orbit Shift',
    genre: 'Sci-Fi',
    year: 2026,
    rating: 8.8,
    runtime: 132,
    director: 'Mira Sol',
    cast: ['Ari Lane', 'Noor Patel', 'Ethan Cole'],
    synopsis: 'A small engineering crew races to stabilize a lunar station before its orbit drifts beyond recovery.',
    mood: 'Tense',
    accent: 'linear-gradient(135deg, #0ea5e9, #7c3aed)',
    rank: 7
  },
  {
    id: 'm-2',
    title: 'Neon Harbour',
    genre: 'Drama',
    year: 2025,
    rating: 8.2,
    runtime: 118,
    director: 'Ishan Rao',
    cast: ['Leah Fox', 'Milo Hart', 'Sara Quinn'],
    synopsis: "Two siblings reopen their late father's cafe and discover the city's best stories are hiding in plain sight.",
    mood: 'Warm',
    accent: 'linear-gradient(135deg, #f97316, #ec4899)',
    rank: 5
  },
  {
    id: 'm-3',
    title: 'Signal Bloom',
    genre: 'Mystery',
    year: 2024,
    rating: 8.5,
    runtime: 124,
    director: 'Tara Venn',
    cast: ['Jules Carter', 'Ivy Chen', 'Omar Malik'],
    synopsis: 'An audio engineer decodes a strange broadcast that appears to predict events one hour ahead.',
    mood: 'Suspense',
    accent: 'linear-gradient(135deg, #22c55e, #14b8a6)',
    rank: 9
  },
  {
    id: 'm-4',
    title: 'Paper Sky',
    genre: 'Romance',
    year: 2023,
    rating: 7.9,
    runtime: 109,
    director: 'Nina Hart',
    cast: ['Maya Reed', 'Theo Ward', 'Zara Lin'],
    synopsis: 'A travel photographer and an archivist find a shared map that leads them through forgotten train routes.',
    mood: 'Soft',
    accent: 'linear-gradient(135deg, #a855f7, #38bdf8)',
    rank: 3
  },
  {
    id: 'm-5',
    title: 'Afterlight',
    genre: 'Thriller',
    year: 2026,
    rating: 8.9,
    runtime: 126,
    director: 'Arjun Mehta',
    cast: ['Kai Brooks', 'Elena Stone', 'Ravi Desai'],
    synopsis: 'A product designer uncovers a hidden agenda inside a smart city launch and must outthink the system.',
    mood: 'Intense',
    accent: 'linear-gradient(135deg, #ef4444, #f97316)',
    rank: 10
  },
  {
    id: 'm-6',
    title: 'The Quiet Engine',
    genre: 'Documentary',
    year: 2022,
    rating: 8.1,
    runtime: 97,
    director: 'Priya Shah',
    cast: ['Dana Brooks', 'Sahil Verma'],
    synopsis: 'A calm, visual exploration of how tiny design decisions shape the apps people use every day.',
    mood: 'Reflective',
    accent: 'linear-gradient(135deg, #14b8a6, #0f172a)',
    rank: 2
  },
  {
    id: 'm-7',
    title: 'Golden Hour Code',
    genre: 'Comedy',
    year: 2024,
    rating: 7.8,
    runtime: 102,
    director: 'Anya Bloom',
    cast: ['Jaden Cole', 'Rhea Stone', 'Leo Hunt'],
    synopsis: 'A group of interns turns a broken demo day into a surprisingly successful product launch.',
    mood: 'Playful',
    accent: 'linear-gradient(135deg, #f59e0b, #eab308)',
    rank: 6
  },
  {
    id: 'm-8',
    title: 'Starlight Run',
    genre: 'Adventure',
    year: 2025,
    rating: 8.0,
    runtime: 121,
    director: 'Karan Vora',
    cast: ['Mira Khan', 'Noah Lee', 'Tess Morgan'],
    synopsis: 'A courier and a cartographer cross three countries to deliver a map that changes ownership every sunrise.',
    mood: 'Epic',
    accent: 'linear-gradient(135deg, #6366f1, #0ea5e9)',
    rank: 4
  }
];

const SORT_OPTIONS: SortOption[] = [
  { value: 'trending', label: 'Trending' },
  { value: 'rating', label: 'Top rated' },
  { value: 'year', label: 'Newest' },
  { value: 'title', label: 'A to Z' }
];

function toTitleCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function loadFavorites(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? '[]') as unknown;
    return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}

function buildAccent(index: number) {
  const palette = [
    'linear-gradient(135deg, #0ea5e9, #7c3aed)',
    'linear-gradient(135deg, #f97316, #ec4899)',
    'linear-gradient(135deg, #22c55e, #14b8a6)',
    'linear-gradient(135deg, #a855f7, #38bdf8)',
    'linear-gradient(135deg, #ef4444, #f97316)'
  ];

  return palette[index % palette.length];
}

function classifyTheme(movie: RemoteFilm, index: number): Genre {
  const title = (movie.title ?? '').toLowerCase();
  const director = (movie.director ?? '').toLowerCase();

  if (title.includes('fireflies') || director.includes('takahata')) {
    return 'Drama';
  }

  if (title.includes('cat') || title.includes('yamadas')) {
    return 'Comedy';
  }

  if (title.includes('spirited') || title.includes('howl') || title.includes('ponyo') || title.includes('castle')) {
    return 'Fantasy';
  }

  if (title.includes('kiki') || title.includes('totoro') || title.includes('whisper') || title.includes('marnie')) {
    return 'Family';
  }

  if (title.includes('mononoke') || title.includes('nausicaa') || title.includes('laputa')) {
    return 'Adventure';
  }

  return ['Adventure', 'Fantasy', 'Drama', 'Mystery', 'Romance'][index % 5] as Genre;
}

function normalizeRemoteFilm(movie: RemoteFilm, index: number): Movie {
  const score = Number(movie.rt_score);
  const theme = classifyTheme(movie, index);

  return {
    id: movie.id ?? `ghibli-${index}`,
    title: movie.title ?? 'Untitled film',
    genre: theme,
    year: Number(movie.release_date) || new Date().getFullYear(),
    rating: Number.isFinite(score) ? Number((score / 10).toFixed(1)) : 0,
    runtime: Number(movie.running_time) || 0,
    director: movie.director ?? 'Unknown',
    cast: [movie.director, movie.producer, movie.release_date].filter((item): item is string => Boolean(item)).slice(0, 3),
    synopsis: movie.description ?? 'No synopsis available.',
    mood: theme,
    accent: buildAccent(index),
    rank: Number.isFinite(score) ? score : 0,
    banner: movie.movie_banner ?? movie.image ?? ''
  };
}

function getHeroStyle(movie: Movie): CSSProperties {
  if (movie.banner) {
    return {
      backgroundImage: `linear-gradient(135deg, rgba(8, 17, 31, 0.2), rgba(8, 17, 31, 0.78)), url(${movie.banner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }

  return { background: movie.accent };
}

function App() {
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<'All' | Genre>('All');
  const [sortBy, setSortBy] = useState<SortBy>('trending');
  const [view, setView] = useState<ViewMode>('Discover');
  const [catalog, setCatalog] = useState<Movie[]>(MOVIES);
  const [catalogSource, setCatalogSource] = useState('Local showcase catalog');
  const [syncMessage, setSyncMessage] = useState('Live catalog is syncing...');
  const [isSyncing, setIsSyncing] = useState(true);
  const [selectedMovieId, setSelectedMovieId] = useState(MOVIES[0].id);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      setLoading(false);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [debouncedQuery, genre, sortBy, view]);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    async function hydrateCatalog() {
      try {
        const response = await fetch(GHIBLI_API_URL, { signal: controller.signal });

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        const data = (await response.json()) as unknown;
        const normalizedMovies = Array.isArray(data)
          ? data.map((movie, index) => normalizeRemoteFilm(movie as RemoteFilm, index))
          : [];

        if (normalizedMovies.length === 0) {
          throw new Error('Empty catalog');
        }

        if (mounted) {
          setCatalog(normalizedMovies);
          setCatalogSource('Studio Ghibli API');
          setSyncMessage(`Loaded ${normalizedMovies.length} live titles from the API.`);
        }
      } catch {
        if (mounted) {
          setCatalog(MOVIES);
          setCatalogSource('Local fallback catalog');
          setSyncMessage('Could not reach the live API, so the app is using the local showcase catalog.');
        }
      } finally {
        if (mounted) {
          setIsSyncing(false);
        }
      }
    }

    hydrateCatalog();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const genreOptions = useMemo<Array<'All' | Genre>>(() => ['All', ...new Set(catalog.map((movie) => movie.genre))], [catalog]);

  const visibleMovies = useMemo(() => {
    const search = debouncedQuery.trim().toLowerCase();

    const filtered = catalog.filter((movie) => {
      const matchesSearch = `${movie.title} ${movie.synopsis} ${movie.director}`.toLowerCase().includes(search);
      const matchesGenre = genre === 'All' || movie.genre === genre;
      const matchesView = view !== 'Favorites' || favorites.includes(movie.id);
      return matchesSearch && matchesGenre && matchesView;
    });

    return filtered.sort((left, right) => {
      if (sortBy === 'rating') {
        return right.rating - left.rating;
      }

      if (sortBy === 'year') {
        return right.year - left.year;
      }

      if (sortBy === 'title') {
        return left.title.localeCompare(right.title);
      }

      return right.rank - left.rank;
    });
  }, [catalog, debouncedQuery, genre, sortBy, view, favorites]);

  const selectedMovie = useMemo(() => {
    return catalog.find((movie) => movie.id === selectedMovieId) ?? visibleMovies[0] ?? catalog[0] ?? MOVIES[0];
  }, [catalog, selectedMovieId, visibleMovies]);

  useEffect(() => {
    if (visibleMovies.length > 0 && !visibleMovies.some((movie) => movie.id === selectedMovieId)) {
      setSelectedMovieId(visibleMovies[0].id);
    }
  }, [visibleMovies, selectedMovieId]);

  const metrics = useMemo(() => {
    const averageRating = visibleMovies.length
      ? (visibleMovies.reduce((total, movie) => total + movie.rating, 0) / visibleMovies.length).toFixed(1)
      : '0.0';
    const uniqueGenres = new Set(visibleMovies.map((movie) => movie.genre)).size;

    return {
      total: visibleMovies.length,
      favorites: favorites.length,
      averageRating,
      genres: uniqueGenres
    };
  }, [visibleMovies, favorites]);

  const isCatalogBusy = loading || isSyncing;

  function toggleFavorite(movieId: string) {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(movieId)
        ? currentFavorites.filter((favoriteId) => favoriteId !== movieId)
        : [...currentFavorites, movieId]
    );
  }

  return (
    <div className="shell movie-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Cinematic case study</p>
          <h1>MovieHub Explorer</h1>
          <p className="lede">
            A cinematic browsing experience with debounced search, simulated loading, favorites, and a strong detail view.
          </p>
          <div className="source-pill">
            <span>{isSyncing ? 'Live sync' : 'Catalog source'}</span>
            <strong>{catalogSource}</strong>
          </div>
          <p className="sync-note">{syncMessage}</p>
        </div>

        <div className="hero-metrics">
          <div className="metric">
            <span>Visible titles</span>
            <strong>{metrics.total}</strong>
          </div>
          <div className="metric">
            <span>Favorites</span>
            <strong>{metrics.favorites}</strong>
          </div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard label="Average rating" value={metrics.averageRating} tone="accent" />
        <StatCard label="Genres shown" value={metrics.genres} tone="success" />
        <StatCard label="Search delay" value="300ms" tone="warning" />
        <StatCard label="Selected" value={selectedMovie.genre} tone="neutral" />
      </section>

      <section className="workspace">
        <main className="panel discovery-panel">
          <div className="panel__header discovery-header">
            <div>
              <p className="section-label">Discover titles</p>
              <h2>Search across titles, directors, and synopses</h2>
            </div>

            <div className="filters">
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or story..."
              />
              <select value={genre} onChange={(event) => setGenre(event.target.value as 'All' | Genre)}>
                {genreOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortBy)}>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="panel-tabs">
            {(['Discover', 'Favorites'] as ViewMode[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={view === tab ? 'tab tab--active' : 'tab'}
                onClick={() => setView(tab)}
              >
                {toTitleCase(tab)}
              </button>
            ))}
          </div>

          {isCatalogBusy ? (
            <div className="movie-grid movie-grid--skeleton">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="movie-skeleton" />
              ))}
            </div>
          ) : (
            <div className="movie-grid">
              {visibleMovies.length > 0 ? (
                visibleMovies.map((movie) => {
                  const isFavorite = favorites.includes(movie.id);

                  return (
                    <article key={movie.id} className="movie-card">
                      <div className="movie-card__hero" style={getHeroStyle(movie)}>
                        <div>
                          <p className="movie-card__label">{movie.genre}</p>
                          <h3>{movie.title}</h3>
                        </div>
                        <button
                          type="button"
                          className={`favorite-toggle ${isFavorite ? 'favorite-toggle--active' : ''}`}
                          onClick={() => toggleFavorite(movie.id)}
                        >
                          {isFavorite ? 'Saved' : 'Save'}
                        </button>
                      </div>

                      <div className="movie-card__body">
                        <div className="movie-meta">
                          <span>{movie.year}</span>
                          <span>{movie.runtime} min</span>
                          <span>Rating {movie.rating}</span>
                        </div>

                        <p>{movie.synopsis}</p>

                        <div className="movie-card__footer">
                          <span>{movie.director}</span>
                          <button type="button" className="primary-button" onClick={() => setSelectedMovieId(movie.id)}>
                            Explore
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>No titles matched the current filters.</p>
                </div>
              )}
            </div>
          )}
        </main>

        <aside className="panel detail-panel">
          <div className="panel__header">
            <div>
              <p className="section-label">Selected title</p>
              <h2>{selectedMovie.title}</h2>
            </div>
            <button type="button" className="text-button" onClick={() => toggleFavorite(selectedMovie.id)}>
              {favorites.includes(selectedMovie.id) ? 'Unsave' : 'Save'}
            </button>
          </div>

          <div className="detail-hero" style={getHeroStyle(selectedMovie)}>
            <div>
              <p className="movie-card__label">{selectedMovie.genre}</p>
              <h3>{selectedMovie.mood}</h3>
            </div>
            <div className="detail-hero__rating">Rating {selectedMovie.rating}</div>
          </div>

          <div className="detail-stack">
            <section className="detail-block">
              <h3>Synopsis</h3>
              <p>{selectedMovie.synopsis}</p>
            </section>

            <section className="detail-block">
              <h3>Production</h3>
              <div className="detail-grid">
                <div>
                  <span>Director</span>
                  <strong>{selectedMovie.director}</strong>
                </div>
                <div>
                  <span>Runtime</span>
                  <strong>{selectedMovie.runtime} min</strong>
                </div>
                <div>
                  <span>Year</span>
                  <strong>{selectedMovie.year}</strong>
                </div>
                <div>
                  <span>Status</span>
                  <strong>{favorites.includes(selectedMovie.id) ? 'Saved' : 'Available'}</strong>
                </div>
              </div>
            </section>

            <section className="detail-block">
              <h3>Cast</h3>
              <div className="chip-list">
                {selectedMovie.cast.map((person) => (
                  <span key={person} className="chip">
                    {person}
                  </span>
                ))}
              </div>
            </section>

            <section className="detail-block">
              <h3>Presentation note</h3>
              <p>
                I built this to show responsive discovery, fast search behavior, and a polished detail experience with saved picks.
              </p>
            </section>
          </div>
        </aside>
      </section>
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: Tone }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export default App;
