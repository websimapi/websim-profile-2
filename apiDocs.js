/* ...existing code... */
/* @tweakable A preamble for the API documentation content provided to the AI assistant. */
const apiDocumentationPreamble = "## Websim API Documentation";

export const apiDocumentationContent = `
${apiDocumentationPreamble}

# Websim Metadata API Endpoints Documentation
This section covers REST API endpoints and client-side APIs for accessing metadata related to projects, users, feeds, and more.  

Base URL:  
\`\`\`
https://api.websim.com
\`\`\`

---

## Data Object Structures

### Root Level Objects
- **site**: Represents the site instance that belongs to this project revision. Contains metadata about how the documentation site is configured, rendered, and interacted with.
- **project**: Represents the overall project container (like a repo). Contains identity, ownership, stats, and publishing info.
- **project_revision**: Represents a specific version (revision) of the project. Each update creates a new revision that captures snapshot state.
- **cursor**: Used for pagination or continuation when querying data from the API. Marks the current position so the next batch can be fetched.
- **token**: Authentication or access tokens if returned. \`null\` means no token was included in this response.
- **included**: Holds related/linked resources that are not inlined in the main object but bundled in the API response for convenience.

---

### Site Object
- **_type**: Identifies the object type (site).
- **id**: Unique identifier of this site.
- **parent_id**: ID of the parent project.
- **created_at**: Timestamp when the site was created.
- **state**: Current state of the site (e.g., draft, done, building).
- **model**: Model used to generate or enhance content (e.g., \`gemini-2.5-pro\`).
- **lore**: Nested configuration object for features and capabilities.
  - **version**
  - **attachments**
  - **enableApi**
  - **enableMultiplayer_v2**
  - **enableMobilePrompt**
  - **enableDB**
  - **enableDB_v2_1**
  - **enableLLM2**
  - **enableTweaks**
  - **enableComments**
- **title**: Human-readable name of the site.
- **url**: Public URL (empty if unpublished).
- **prompt**: Base prompt that initialized the site.
  - **type**
  - **text**
- **owner**: User who owns this site.
  - **id, username, avatar_url, discord_id, discord_username, created_at, is_admin**
- **link_url**: Relative system link.
- **versioned_link_url**: Version-specific link.
- **deleted_at**: Deletion timestamp.
- **yapping**: Auto-analysis / notes.

---

### Project Object
- **_type**: Object type (project).
- **id**
- **created_at**, **updated_at**
- **title**
- **visibility**: (public, private, unlisted)
- **slug**
- **created_by**: User details (same fields as above).
- **current_version**, **last_posted_version**
- **parent_id**, **parent_version**
- **deleted_at**
- **posted**: Boolean (live or not).
- **stats**:
  - **views**
  - **likes**
  - **comments**
- **auto_set_current**
- **description**
- **comments_mode**
- **enable_chat**
- **from_template**
- **domains**: Custom domains
- **thumbnail**: (moderation_state, url)
- **video**: Linked demo video

---

### Project Revision Object
- **_type**
- **id**
- **version**
- **created_at**, **updated_at**, **visited_at**, **deleted_at**
- **parent_id**
- **parent_revision_version**
- **parent_revision_project_id**
- **created_by**: User object
- **meta.version**
- **project_id**
- **stats.multiplayer_count**
- **draft**
- **site_id**
- **chat_session_id**, **chat_session_run_index**
- **current_screenshot_url**

---

### Cursor, Token, and Included
- **cursor**: For pagination.
- **token**: Auth/session token if included.
- **included**: Linked resources packaged in response.

---

# REST API Endpoints

All endpoints follow REST conventions with \`GET\`, \`POST\`, \`PATCH\`, and \`DELETE\` methods.  
Pagination parameters (\`first\`, \`last\`, \`before\`, \`after\`) are generally supported. Filtering/sorting options vary by endpoint.  

---

## Project Endpoints
- **Get Project by ID**  
  \`GET /api/v1/projects/{id}\`

- **Get Project by Slug**  
  \`GET /api/v1/users/{user}/slugs/{slug}\`

- **List All Public Projects**  
  \`GET /api/v1/projects\`

- **List User’s Projects**  
  \`GET /api/v1/users/{user}/projects\`

- **List Following Users’ Projects**  
  \`GET /api/v1/users/{user}/following/projects\`

- **List Project Descendants**  
  \`GET /api/v1/projects/{id}/descendants\`

- **Check if Project is Featured**  
  \`GET /api/v1/featured/{id}\`

---

## Project Revision Endpoints
- **Get Project Revision**  
  \`GET /api/v1/projects/{id}/revisions/{version}\`

- **Get Project Revision by Slug**  
  \`GET /api/v1/users/{user}/slugs/{slug}/revisions/{version}\`

- **List Project Revisions**  
  \`GET /api/v1/projects/{id}/revisions\`

- **List Project Revision Descendants**  
  \`GET /api/v1/projects/{id}/revisions/{version}/descendants\`

---

## Project Asset Endpoints
- **List Assets**  
  \`GET /api/v1/projects/{id}/revisions/{version}/assets\`

- **Get Asset Content**  
  \`GET /api/v1/projects/{id}/revisions/{version}/assets/{path}/content\`

---

## Project Stats & Screenshot Endpoints
- **Get Project Stats**  
  \`GET /api/v1/projects/{id}/stats\`

- **Get Project Permissions**  
  \`GET /api/v1/projects/{id}/permissions\`

- **List Project Screenshots**  
  \`GET /api/v1/projects/{id}/revisions/{version}/screenshots\`

- **Get Project Screenshot**  
  \`GET /api/v1/projects/{id}/revisions/{version}/screenshots/{screenshot_id}\`

---

## HTML Endpoints
- **Get Site HTML Content**  
  \`GET /api/v1/sites/{id}/html\`

- **Get Project Revision HTML Content**  
  \`GET /api/v1/projects/{id}/revisions/{version}/html\`

- **Transform HTML Content**  
  \`POST /api/v1/transform/html\`

---

## Inference Endpoints
- **AI Completion**  
  \`POST /api/ai_completion\`

- **Prompt Autosuggest**  
  \`POST /api/v1/inference/prompt_autosuggest\`

- **Image Generation**
  \`POST /api/v1/inference/run_image_generation\`
  The WebSim image generation API enforces request limits. If too many requests are made in a short time, it returns \`429 Too Many Requests\` with headers that indicate whether the per-minute or daily limit has been exceeded. The \`server-timing\` response header includes \`rate_limit_minute\` and \`rate_limit_daily\`, which show which quota triggered the error. To avoid failures, requests should be throttled, retried with backoff when a \`429\` is received, and users should be informed when they must wait for the limit to reset.
Normal image generation using the Flux model does not typically hit rate limits, as it is designed for direct creation. Image transformation using the Nano Banana model can hit rate limits due to its more intensive processing and specialized capabilities.

---

## User Endpoints
- **Get User Details**  
  \`GET /api/v1/users/{user}\`

- **Search Users**  
  \`GET /api/v1/user-search?query={query}\`

- **Update User Description**  
  \`PATCH /api/v1/users/{user}\`

- **Get User Stats**  
  \`GET /api/v1/users/{user}/stats\`

---

## Follow Endpoints
- **List Following**  
  \`GET /api/v1/users/{user}/following\`

- **List Followers**  
  \`GET /api/v1/users/{user}/followers\`

- **Follow User**  
  \`POST /api/v1/users/{user}/follow\`

- **Unfollow User**  
  \`DELETE /api/v1/users/{user}/follow\`

---

## Like Endpoints
- **List User Likes**  
  \`GET /api/v1/users/{user}/likes\`

- **Check Project Like**  
  \`GET /api/v1/users/{user}/project/{project_id}/like\`

- **Get Trending Feed**  
  \`GET /api/v1/feed/trending\`

- **Get Posts Feed**  
  \`GET /api/v1/feed/posts\`

- **Search Feed**  
  \`GET /api/v1/feed/search/{sort}/{search}\`
  Search the feed for projects/sites based on keywords (\`search\`) and sort criteria (\`sort\`). Supports pagination (\`offset\`, \`limit\`) and filtering (\`range\`, \`feed\`, \`for_user_id\`, \`is_multiplayer\`).
  Available sort options:
  - \`"best"\`
  - \`"newest"\`
  - \`"best_template"\`

- **Get Trending Rooms**  
  \`GET /api/v1/feed/rooms\`

---

## Search Endpoints
- **Simple Asset Search**  
  \`GET /api/v1/search/assets\`

- **Bulk Asset Search**  
  \`POST /api/v1/search/assets/bulk\`

- **Relevant Asset Search**  
  \`GET /api/v1/search/assets/relevant\`

- **Get Related Keywords**  
  \`GET /api/v1/search/related\`

- **Get Top Searches**  
  \`GET /api/v1/search/top\`

---

## Comment Endpoints (REST)
- **List Project Comments**  
  \`GET /api/v1/projects/{id}/comments\`

- **Create Comment**  
  \`POST /api/v1/projects/{id}/comments\`

- **List Comment Replies**  
  \`GET /api/v1/projects/{id}/comments/{comment_id}/replies\`

- **Create Comment Reaction**  
  \`POST /api/v1/projects/{id}/comments/{comment_id}/reactions\`

- **Delete Comment Reaction**  
  \`DELETE /api/v1/projects/{id}/comments/{comment_id}/reactions\`

---

## Chat Endpoints
- **Create Chat Message Reaction**  
  \`POST /api/v1/messages/{message_id}/reactions\`

- **Delete Chat Message Reaction**  
  \`DELETE /api/v1/messages/{message_id}/reactions/{emoji}\`

---

## Activity & Report Endpoints
- **Activity Feed**  
  \`GET /api/v1/activity-feed\`

- **Create Report**  
  \`POST /api/v1/reports\`

---

## WebsimSocket / Records API
The \`WebsimSocket\` provides real-time communication and persistent record storage.

### Persistent Records
Records are persistent data structures. To access them:

-   **\`room.collection('<type>').getList()\`**: This method returns the current list of records for a given type **synchronously** (it does not return a Promise). It can return an empty array initially while data is loading.
-   **\`room.collection('<type>').subscribe(<callback>)\`**: Use this method for real-time updates. It triggers immediately with the current list of records and whenever the list changes.

---

✅ **Total endpoints documented: 37**
`;

window.websimApiDocs = { apiDocumentationPreamble, apiDocumentationContent };
/* ...existing code... */

