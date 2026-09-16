/* =========================================
   CBRA — GENERAL MEDIA MANAGEMENT
   =========================================

   Handles:
   - General case media
   - Loading sources through source_cases
   - Adding media
   - Editing media
   - Deleting media
   - Cancel Edit
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const generalMediaSupabase =
    window.supabaseClient;


/* -----------------------------------------
   EDIT STATE
   ----------------------------------------- */

let generalMediaEditingId = null;


/* -----------------------------------------
   GET CURRENT CASE
   ----------------------------------------- */

function getGeneralMediaCaseId() {

    const selector =
        document.getElementById(
            "case-selector"
        );

    if (
        selector &&
        selector.value
    ) {

        return selector.value;

    }


    if (
        typeof window.getCurrentCaseId ===
        "function"
    ) {

        return window.getCurrentCaseId();

    }


    return "";

}


/* -----------------------------------------
   MESSAGE
   ----------------------------------------- */

function setGeneralMediaMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "media-message"
        );

    if (!element) {
        return;
    }


    element.textContent =
        message || "";


    element.style.color =
        isError
            ? "red"
            : "";

}


/* -----------------------------------------
   BUILD GENERAL MEDIA FORM
   ----------------------------------------- */

function buildGeneralMediaForm() {

    const container =
        document.getElementById(
            "general-media-management"
        );


    if (!container) {
        return;
    }


    /*
       Do not rebuild the form if it already
       exists.
    */

    if (
        document.getElementById(
            "media-form"
        )
    ) {

        return;

    }


    container.innerHTML = `
        <div class="management-card">

            <div class="management-card-header">

                <h4>
                    Add General Media
                </h4>

                <p>
                    Add photographs, videos, articles,
                    broadcasts, or other external media
                    associated with the selected case.
                </p>

            </div>


            <form id="media-form">

                <div class="form-grid">


                    <!-- TITLE -->

                    <div class="form-group">

                        <label for="media-title">
                            Media Title
                        </label>

                        <input
                            type="text"
                            id="media-title"
                            placeholder="Media title"
                            required
                        >

                    </div>


                    <!-- MEDIA TYPE -->

                    <div class="form-group">

                        <label for="media-type">
                            Media Type
                        </label>

                        <select id="media-type">

                            <option value="">
                                -- Select Type --
                            </option>

                            <option value="Photograph">
                                Photograph
                            </option>

                            <option value="Video">
                                Video
                            </option>

                            <option value="News Article">
                                News Article
                            </option>

                            <option value="Broadcast">
                                Broadcast
                            </option>

                            <option value="Interview">
                                Interview
                            </option>

                            <option value="Social Media">
                                Social Media
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                    </div>


                    <!-- URL -->

                    <div class="form-group form-group-full">

                        <label for="media-url">
                            Media URL
                        </label>

                        <input
                            type="url"
                            id="media-url"
                            placeholder="https://..."
                            required
                        >

                    </div>


                    <!-- DESCRIPTION -->

                    <div class="form-group form-group-full">

                        <label for="media-description">
                            Description
                        </label>

                        <textarea
                            id="media-description"
                            rows="4"
                            placeholder="Briefly describe the media..."
                        ></textarea>

                    </div>


                    <!-- SOURCE -->

                    <div class="form-group form-group-full">

                        <label for="media-source">
                            Source
                        </label>

                        <select id="media-source">

                            <option value="">
                                -- No Source --
                            </option>

                        </select>

                    </div>


                </div>


                <div class="form-actions">

                    <button
                        type="submit"
                        id="media-submit-button"
                        class="primary-button"
                    >
                        Add Media
                    </button>


                    <button
                        type="button"
                        id="media-cancel-button"
                        class="secondary-button"
                        style="display: none;"
                    >
                        Cancel Edit
                    </button>

                </div>


                <div
                    id="media-message"
                    class="manage-message"
                ></div>

            </form>

        </div>


        <div
            id="media-list"
            class="manage-record-list"
        >

            <p class="empty-message">
                Select a case to view general media.
            </p>

        </div>
    `;


    const form =
        document.getElementById(
            "media-form"
        );


    const cancelButton =
        document.getElementById(
            "media-cancel-button"
        );


    if (form) {

        form.addEventListener(
            "submit",
            saveGeneralMedia
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            cancelGeneralMediaEdit
        );

    }


    setGeneralMediaEditMode(
        false
    );

}


/* -----------------------------------------
   FORM STATE
   ----------------------------------------- */

function setGeneralMediaEditMode(
    editing
) {

    const submitButton =
        document.getElementById(
            "media-submit-button"
        );


    const cancelButton =
        document.getElementById(
            "media-cancel-button"
        );


    if (submitButton) {

        submitButton.textContent =
            editing
                ? "Save Changes"
                : "Add Media";

    }


    if (cancelButton) {

        cancelButton.style.display =
            editing
                ? "inline-block"
                : "none";

    }

}


/* -----------------------------------------
   RESET FORM
   ----------------------------------------- */

function resetGeneralMediaForm() {

    const form =
        document.getElementById(
            "media-form"
        );


    if (form) {

        form.reset();

    }


    generalMediaEditingId =
        null;


    setGeneralMediaEditMode(
        false
    );


    setGeneralMediaMessage(
        ""
    );

}


/* -----------------------------------------
   LOAD SOURCES
   ----------------------------------------- */

async function loadGeneralMediaSources(
    caseId,
    selectedSourceId = ""
) {

    const selector =
        document.getElementById(
            "media-source"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML =
        '<option value="">-- No Source --</option>';


    if (!caseId) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await generalMediaSupabase
                .from(
                    "source_cases"
                )
                .select(`
                    source_id,
                    source:sources (
                        id,
                        title
                    )
                `)
                .eq(
                    "case_id",
                    Number(caseId)
                );


        if (error) {
            throw error;
        }


        const sources =
            (data || [])
                .map(
                    function(connection) {

                        return connection.source;

                    }
                )
                .filter(
                    function(source) {

                        return Boolean(
                            source
                        );

                    }
                );


        /*
           Remove duplicate sources.
        */

        const uniqueSources =
            Array.from(
                new Map(
                    sources.map(
                        function(source) {

                            return [
                                String(
                                    source.id
                                ),
                                source
                            ];

                        }
                    )
                ).values()
            );


        /*
           Alphabetical order.
        */

        uniqueSources.sort(
            function(a, b) {

                return String(
                    a.title || ""
                ).localeCompare(
                    String(
                        b.title || ""
                    )
                );

            }
        );


        uniqueSources.forEach(
            function(source) {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    String(
                        source.id
                    );


                option.textContent =
                    source.title ||
                    "Untitled Source";


                selector.appendChild(
                    option
                );

            }
        );


        /*
           Restore selected source when editing.
        */

        if (
            selectedSourceId !== null &&
            selectedSourceId !== undefined &&
            String(selectedSourceId) !== ""
        ) {

            const wantedValue =
                String(
                    selectedSourceId
                );


            const matchingOption =
                Array.from(
                    selector.options
                ).find(
                    function(option) {

                        return (
                            String(
                                option.value
                            ) === wantedValue
                        );

                    }
                );


            if (matchingOption) {

                selector.value =
                    wantedValue;

            }

        }


    } catch (error) {

        console.error(
            "General media source loading error:",
            error
        );


        selector.innerHTML =
            '<option value="">-- Unable to load sources --</option>';

    }

}


/* -----------------------------------------
   LOAD GENERAL MEDIA
   ----------------------------------------- */

async function loadGeneralMedia(
    caseId
) {

    buildGeneralMediaForm();


    const list =
        document.getElementById(
            "media-list"
        );


    if (!list) {
        return;
    }


    if (!caseId) {

        list.innerHTML =
            '<p class="empty-message">Select a case to view general media.</p>';

        return;

    }


    list.innerHTML =
        "<p>Loading media...</p>";


    try {

        const {
            data,
            error
        } =
            await generalMediaSupabase
                .from(
                    "case_media"
                )
                .select("*")
                .eq(
                    "case_id",
                    caseId
                )
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {
            throw error;
        }


        list.innerHTML =
            "";


        if (
            !data ||
            data.length === 0
        ) {

            list.innerHTML =
                '<p class="empty-message">No general media added yet.</p>';

            return;

        }


        /*
           Gather source IDs.
        */

        const sourceIds =
            Array.from(
                new Set(
                    data
                        .map(
                            function(media) {

                                return media.source_id;

                            }
                        )
                        .filter(
                            function(sourceId) {

                                return (
                                    sourceId !== null &&
                                    sourceId !== undefined &&
                                    sourceId !== ""
                                );

                            }
                        )
                        .map(
                            function(sourceId) {

                                return String(
                                    sourceId
                                );

                            }
                        )
                )
            );


        let sourceMap =
            new Map();


        /*
           Load source names.
        */

        if (
            sourceIds.length > 0
        ) {

            const {
                data: sourceRows,
                error: sourceError
            } =
                await generalMediaSupabase
                    .from(
                        "sources"
                    )
                    .select(
                        "id, title"
                    )
                    .in(
                        "id",
                        sourceIds
                    );


            if (sourceError) {

                console.error(
                    "General media source lookup error:",
                    sourceError
                );

            } else {

                (sourceRows || [])
                    .forEach(
                        function(source) {

                            sourceMap.set(
                                String(
                                    source.id
                                ),
                                source
                            );

                        }
                    );

            }

        }


        /*
           BUILD CARDS
        */

        data.forEach(
            function(media) {

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "manage-record";


                /*
                   TITLE
                */

                const title =
                    document.createElement(
                        "strong"
                    );


                title.textContent =
                    media.title ||
                    "Untitled Media";


                card.appendChild(
                    title
                );


                /*
                   TYPE
                */

                if (
                    media.media_type
                ) {

                    const type =
                        document.createElement(
                            "p"
                        );


                    type.textContent =
                        "Type: " +
                        media.media_type;


                    card.appendChild(
                        type
                    );

                }


                /*
                   DESCRIPTION
                */

                if (
                    media.description
                ) {

                    const description =
                        document.createElement(
                            "p"
                        );


                    description.textContent =
                        media.description;


                    card.appendChild(
                        description
                    );

                }


                /*
                   SOURCE
                */

                if (
                    media.source_id
                ) {

                    const source =
                        sourceMap.get(
                            String(
                                media.source_id
                            )
                        );


                    const sourceElement =
                        document.createElement(
                            "p"
                        );


                    sourceElement.textContent =
                        "Source: " +
                        (
                            source
                                ? (
                                    source.title ||
                                    "Untitled Source"
                                )
                                : "Source unavailable"
                        );


                    card.appendChild(
                        sourceElement
                    );

                }


                /*
                   OPEN MEDIA
                */

                if (
                    media.media_url
                ) {

                    const link =
                        document.createElement(
                            "a"
                        );


                    link.href =
                        media.media_url;


                    link.textContent =
                        "Open Media";


                    link.target =
                        "_blank";


                    link.rel =
                        "noopener noreferrer";


                    card.appendChild(
                        link
                    );

                }


                /*
                   ACTIONS
                */

                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "manage-record-actions";


                /*
                   EDIT
                */

                const editButton =
                    document.createElement(
                        "button"
                    );


                editButton.type =
                    "button";


                editButton.textContent =
                    "Edit";


                editButton.addEventListener(
                    "click",
                    function() {

                        editGeneralMedia(
                            media.id
                        );

                    }
                );


                actions.appendChild(
                    editButton
                );


                /*
                   REMOVE
                */

                const removeButton =
                    document.createElement(
                        "button"
                    );


                removeButton.type =
                    "button";


                removeButton.textContent =
                    "Remove";


                removeButton.addEventListener(
                    "click",
                    function() {

                        removeGeneralMedia(
                            media.id
                        );

                    }
                );


                actions.appendChild(
                    removeButton
                );


                card.appendChild(
                    actions
                );


                list.appendChild(
                    card
                );

            }
        );


    } catch (error) {

        console.error(
            "General media loading error:",
            error
        );


        list.innerHTML =
            '<p class="form-message">Unable to load general media.</p>';

    }

}


/* -----------------------------------------
   EDIT GENERAL MEDIA
   ----------------------------------------- */

async function editGeneralMedia(
    mediaId
) {

    if (!mediaId) {
        return;
    }


    const titleElement =
        document.getElementById(
            "media-title"
        );


    const typeElement =
        document.getElementById(
            "media-type"
        );


    const urlElement =
        document.getElementById(
            "media-url"
        );


    const descriptionElement =
        document.getElementById(
            "media-description"
        );


    const sourceElement =
        document.getElementById(
            "media-source"
        );


    if (
        !titleElement ||
        !typeElement ||
        !urlElement ||
        !descriptionElement ||
        !sourceElement
    ) {

        console.error(
            "General media form elements could not be found."
        );

        return;

    }


    try {

        setGeneralMediaMessage(
            "Loading media..."
        );


        const {
            data: media,
            error
        } =
            await generalMediaSupabase
                .from(
                    "case_media"
                )
                .select("*")
                .eq(
                    "id",
                    mediaId
                )
                .single();


        if (error) {
            throw error;
        }


        if (!media) {

            throw new Error(
                "Media record could not be found."
            );

        }


        const caseId =
            media.case_id ||
            getGeneralMediaCaseId();


        if (!caseId) {

            throw new Error(
                "The media item is not connected to a case."
            );

        }


        generalMediaEditingId =
            media.id;


        setGeneralMediaEditMode(
            true
        );


        titleElement.value =
            media.title || "";


        typeElement.value =
            media.media_type || "";


        urlElement.value =
            media.media_url || "";


        descriptionElement.value =
            media.description || "";


        /*
           Wait for sources.
        */

        await loadGeneralMediaSources(
            caseId,
            media.source_id || ""
        );


        const form =
            document.getElementById(
                "media-form"
            );


        if (form) {

            form.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        }


        setGeneralMediaMessage(
            "Editing media. Make your changes and click Save Changes."
        );


    } catch (error) {

        console.error(
            "General media edit error:",
            error
        );


        generalMediaEditingId =
            null;


        setGeneralMediaEditMode(
            false
        );


        setGeneralMediaMessage(
            "Unable to load this media item.",
            true
        );

    }

}


/* -----------------------------------------
   SAVE GENERAL MEDIA
   ----------------------------------------- */

async function saveGeneralMedia(
    event
) {

    event.preventDefault();


    const caseId =
        getGeneralMediaCaseId();


    if (!caseId) {

        setGeneralMediaMessage(
            "Please select a case first.",
            true
        );

        return;

    }


    const titleElement =
        document.getElementById(
            "media-title"
        );


    const typeElement =
        document.getElementById(
            "media-type"
        );


    const urlElement =
        document.getElementById(
            "media-url"
        );


    const descriptionElement =
        document.getElementById(
            "media-description"
        );


    const sourceElement =
        document.getElementById(
            "media-source"
        );


    if (
        !titleElement ||
        !typeElement ||
        !urlElement ||
        !descriptionElement ||
        !sourceElement
    ) {

        console.error(
            "General media form elements could not be found."
        );

        return;

    }


    const title =
        titleElement.value.trim();


    const mediaType =
        typeElement.value;


    const mediaUrl =
        urlElement.value.trim();


    const description =
        descriptionElement.value.trim();


    const sourceId =
        sourceElement.value
            ? Number(
                sourceElement.value
            )
            : null;


    if (!title) {

        setGeneralMediaMessage(
            "Please enter a media title.",
            true
        );

        return;

    }


    if (!mediaUrl) {

        setGeneralMediaMessage(
            "Please enter a media URL.",
            true
        );

        return;

    }


    try {

        new URL(
            mediaUrl
        );

    } catch {

        setGeneralMediaMessage(
            "Please enter a valid media URL.",
            true
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "media-submit-button"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.textContent =
            generalMediaEditingId
                ? "Saving..."
                : "Adding...";

    }


    try {

        const payload = {

            case_id:
                caseId,

            title:
                title,

            media_type:
                mediaType || null,

            media_url:
                mediaUrl,

            description:
                description || null,

            source_id:
                sourceId

        };


        /*
           UPDATE
        */

        if (
            generalMediaEditingId
        ) {

            const {
                error
            } =
                await generalMediaSupabase
                    .from(
                        "case_media"
                    )
                    .update(
                        payload
                    )
                    .eq(
                        "id",
                        generalMediaEditingId
                    );


            if (error) {
                throw error;
            }


            setGeneralMediaMessage(
                "Media updated successfully."
            );

        }


        /*
           INSERT
        */

        else {

            const {
                error
            } =
                await generalMediaSupabase
                    .from(
                        "case_media"
                    )
                    .insert(
                        payload
                    );


            if (error) {
                throw error;
            }


            setGeneralMediaMessage(
                "Media added successfully."
            );

        }


        generalMediaEditingId =
            null;


        setGeneralMediaEditMode(
            false
        );


        titleElement.value =
            "";


        typeElement.value =
            "";


        urlElement.value =
            "";


        descriptionElement.value =
            "";


        sourceElement.value =
            "";


        await loadGeneralMediaSources(
            caseId
        );


        await loadGeneralMedia(
            caseId
        );


    } catch (error) {

        console.error(
            "General media save error:",
            error
        );


        setGeneralMediaMessage(
            error.message ||
            "Unable to save media.",
            true
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.textContent =
                generalMediaEditingId
                    ? "Save Changes"
                    : "Add Media";

        }

    }

}


/* -----------------------------------------
   CANCEL EDIT
   ----------------------------------------- */

function cancelGeneralMediaEdit() {

    resetGeneralMediaForm();


    const caseId =
        getGeneralMediaCaseId();


    if (caseId) {

        loadGeneralMediaSources(
            caseId
        );

    }


    setGeneralMediaMessage(
        "Edit cancelled."
    );

}


/* -----------------------------------------
   REMOVE GENERAL MEDIA
   ----------------------------------------- */

async function removeGeneralMedia(
    mediaId
) {

    if (!mediaId) {
        return;
    }


    if (
        !confirm(
            "Remove this media item?"
        )
    ) {

        return;

    }


    try {

        const {
            error
        } =
            await generalMediaSupabase
                .from(
                    "case_media"
                )
                .delete()
                .eq(
                    "id",
                    mediaId
                );


        if (error) {
            throw error;
        }


        if (
            String(
                generalMediaEditingId
            ) ===
            String(
                mediaId
            )
        ) {

            resetGeneralMediaForm();

        }


        const caseId =
            getGeneralMediaCaseId();


        await loadGeneralMedia(
            caseId
        );


        setGeneralMediaMessage(
            "Media removed successfully."
        );


    } catch (error) {

        console.error(
            "General media deletion error:",
            error
        );


        setGeneralMediaMessage(
            "Unable to remove this media item.",
            true
        );

    }

}


/* -----------------------------------------
   INITIALIZE
   ----------------------------------------- */

function initializeGeneralMedia() {

    /*
       The form is built dynamically.
    */

    buildGeneralMediaForm();


    const caseId =
        getGeneralMediaCaseId();


    if (caseId) {

        loadGeneralMediaSources(
            caseId
        );


        loadGeneralMedia(
            caseId
        );

    }

}


/* -----------------------------------------
   CASE SELECTOR LISTENER
   ----------------------------------------- */

function initializeGeneralMediaCaseListener() {

    const selector =
        document.getElementById(
            "case-selector"
        );


    if (!selector) {
        return;
    }


    selector.addEventListener(
        "change",
        async function() {

            generalMediaEditingId =
                null;


            resetGeneralMediaForm();


            const caseId =
                selector.value;


            await loadGeneralMediaSources(
                caseId
            );


            await loadGeneralMedia(
                caseId
            );

        }
    );

}


/* -----------------------------------------
   DOM READY
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeGeneralMedia();

        initializeGeneralMediaCaseListener();

    }
);


/* -----------------------------------------
   PUBLIC FUNCTIONS
   ----------------------------------------- */

window.loadGeneralMedia =
    loadGeneralMedia;


window.loadGeneralMediaSources =
    loadGeneralMediaSources;


window.editGeneralMedia =
    editGeneralMedia;


window.saveGeneralMedia =
    saveGeneralMedia;


window.cancelGeneralMediaEdit =
    cancelGeneralMediaEdit;


window.removeGeneralMedia =
    removeGeneralMedia;

window.loadMediaSources =
    loadGeneralMediaSources;

window.loadMedia =
    loadGeneralMedia;