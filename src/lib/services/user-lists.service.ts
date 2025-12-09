import type { AddMovieToListCommand, AddedMovieToListDto, UserListsDto } from "../../types";
import type { SupabaseClient } from "../../db/supabase.client";

export class UserListsService {
  /**
   * Retrieves all movies on the user's watchlist and favorite lists.
   *
   * @param userId - The user ID
   * @param supabase - Supabase client
   * @returns Object containing watchlist and favorite arrays
   * @throws Error if the operation fails
   */
  async getUserLists(userId: string, supabase: SupabaseClient): Promise<UserListsDto> {
    const { data, error } = await supabase
      .from("user_lists")
      .select("tmdb_id, list_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Group by list type
    const watchlist = data?.filter((item) => item.list_type === "watchlist") || [];
    const favorite = data?.filter((item) => item.list_type === "favorite") || [];

    return {
      watchlist: watchlist.map((item) => ({
        tmdb_id: item.tmdb_id,
        created_at: item.created_at,
      })),
      favorite: favorite.map((item) => ({
        tmdb_id: item.tmdb_id,
        created_at: item.created_at,
      })),
    };
  }

  /**
   * Adds a movie to a specified list (watchlist or favorite).
   *
   * @param command - The command containing tmdb_id and list_type
   * @param userId - The user ID
   * @param supabase - Supabase client
   * @returns Object containing the added movie data
   * @throws Error if the operation fails or movie already exists in list
   */
  async addMovieToList(
    command: AddMovieToListCommand,
    userId: string,
    supabase: SupabaseClient
  ): Promise<AddedMovieToListDto> {
    const { data, error } = await supabase
      .from("user_lists")
      .insert({
        user_id: userId,
        tmdb_id: command.tmdb_id,
        list_type: command.list_type,
      })
      .select("tmdb_id, list_type, created_at")
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Failed to add movie to list");
    }

    return {
      tmdb_id: data.tmdb_id,
      list_type: data.list_type,
      created_at: data.created_at,
    };
  }

  /**
   * Removes a movie from a specified list.
   *
   * @param tmdbId - The Movie Database ID
   * @param listType - The list type ('watchlist' or 'favorite')
   * @param userId - The user ID
   * @param supabase - Supabase client
   * @throws Error if the operation fails
   */
  async removeMovieFromList(
    tmdbId: number,
    listType: "watchlist" | "favorite",
    userId: string,
    supabase: SupabaseClient
  ): Promise<void> {
    const { error } = await supabase
      .from("user_lists")
      .delete()
      .eq("user_id", userId)
      .eq("tmdb_id", tmdbId)
      .eq("list_type", listType);

    if (error) {
      throw error;
    }
  }
}
