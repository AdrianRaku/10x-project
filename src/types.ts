import type { Tables } from './db/database.types';

/**
 * Represents the base rating entity from the database.
 */
type RatingEntity = Tables<'ratings'>;

/**
 * Represents the base user list entity from the database.
 */
type UserListEntity = Tables<'user_lists'>;

// #region Ratings API

/**
 * DTO for a movie rating, as returned by the API.
 * Omits database-specific fields like `id` and `user_id`.
 */
export type RatingDto = Omit<RatingEntity, 'id' | 'user_id'>;

/**
 * Command model for adding or updating a movie rating.
 * Contains only the data required from the client.
 */
export type AddOrUpdateRatingCommand = Pick<RatingEntity, 'tmdb_id' | 'rating'>;

// #endregion

// #region User Lists API

/**
 * DTO for a single item on a user's list (watchlist or favorite).
 * Contains the movie ID and the date it was added.
 */
export type UserListItemDto = Pick<UserListEntity, 'tmdb_id' | 'created_at'>;

/**
 * DTO for all of the user's lists, categorized by list type.
 */
export type UserListsDto = {
  watchlist: UserListItemDto[];
  favorite: UserListItemDto[];
};

/**
 * Command model for adding a movie to a user's list.
 */
export type AddMovieToListCommand = Pick<UserListEntity, 'tmdb_id' | 'list_type'>;

/**
 * DTO for the response after successfully adding a movie to a list.
 */
export type AddedMovieToListDto = Pick<UserListEntity, 'tmdb_id' | 'list_type' | 'created_at'>;

// #endregion

// #region AI Recommendations API

/**
 * Command model for generating movie recommendations.
 * Includes an optional text prompt to guide the AI.
 */
export type GenerateRecommendationsCommand = {
  prompt?: string;
};

/**
 * DTO for a single movie recommendation returned by the AI service.
 * This is a custom type not directly derived from a single database entity.
 */
export type RecommendationDto = {
  tmdb_id: number;
  title: string;
  year: number;
  posterPath: string | null;
};

// #endregion

// #region Movies (TMDb Proxy) API

/**
 * DTO for a movie search result from the TMDb proxy.
 * This is a custom type representing a subset of data from the external TMDb API.
 */
export type MovieSearchResultDto = {
  tmdb_id: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
};

// #endregion

