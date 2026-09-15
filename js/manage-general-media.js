/* =========================================
   CBRA — GENERAL MEDIA MANAGEMENT
   =========================================
   
   Handles:
   - Loading case media
   - Loading sources through source_cases
   - Adding media
   - Editing media
   - Deleting media
   - Reliable source selection during Edit
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

    /*
       Prefer the shared CBRA case selector.
    */

    const selector =
        document.getElementById(
            "case-selector"
        );

    if (selector && selector.value) {

        return selector.value;

    }


    /*
       Fall back to the global helper if one
       exists.
    */

    if (
        typeof window.getCurrentCaseId ===
        "function"
    ) {

        return window.getCurrentCaseId();

    }


    return "";

}


/* -----------------------------------------
   MESSAGE HELPER
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
   LOAD SOURCES FOR CURRENT CASE
   -----------------------------------------

   IMPORTANT:

   Sources are NOT loaded directly from
   sources.case_id anymore.

   They are connected through:

       source_cases
           ↓
       sources

   This is the same central system now used
   by the crime-scene photo selector.
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
        '<option value="">-- Select Source --</option>';


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
           Remove duplicate source IDs just in
           case the relationship table contains
           duplicate rows.
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
           Sort alphabetically.
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
           IMPORTANT:

           Only set the selected value AFTER
           the options have finished loading.

           This is what makes Edit reliably
           restore the correct source.
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
   LOAD MEDIA
   ----------------------------------------- */

async function loadGeneralMedia(
    caseId
) {

    const list =
        document.getElementById(
            "media-list"
        );


    if (!list) {

        return;

    }


    if (!caseId) {

        list.innerHTML =
            '<p class="empty-message">Select a case to view media.</p>';

        return;

    }


    list.innerHTML =
        "<p>Loading media...</p>";


    try {

        /*
           Do NOT rely on a direct sources
           relationship here.

           source_id belongs to the media record,
           while the source itself is a central
           source record.
        */

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
                '<p class="empty-message">No media added yet.</p>';

            return;

        }


        /*
           Get all source IDs used by these
           media records.
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


        /*
           Load the source titles separately.

           This avoids depending on an old
           foreign-key relationship from media
           directly to sources.
        */

        let sourceMap =
            new Map();


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
           BUILD MEDIA CARDS
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
                   INFORMATION
                */

                const info =
                    document.createElement(
                        "div"
                    );


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


                info.appendChild(
                    title
                );


                /*
                   MEDIA TYPE
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


                    info.appendChild(
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


                    info.appendChild(
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


                    info.appendChild(
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


                    info.appendChild(
                        link
                    );

                }


                card.appendChild(
                    info
                );


                /*
                   BUTTON CONTAINER
                */

                const actions =
                    document.createElement(
                        "div"
                    );


                actions.className =
                    "manage-record-actions";


                /*
                   EDIT BUTTON
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
                   REMOVE BUTTON
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
            '<p class="form-message">Unable to load media.</p>';

    }

}


/* -----------------------------------------
   EDIT MEDIA
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
            "General media edit form elements could not be found."
        );

        return;

    }


    try {

        setGeneralMediaMessage(
            "Loading media..."
        );


        /*
           Fetch the complete media record.
        */

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


        /*
           Get the current case.

           The media record's case_id is the
           authoritative case for this edit.
        */

        const caseId =
            media.case_id ||
            getGeneralMediaCaseId();


        if (!caseId) {

            throw new Error(
                "The media item is not connected to a case."
            );

        }


        /*
           Enter edit mode BEFORE loading the
           source options.
        */

        generalMediaEditingId =
            media.id;


        setGeneralMediaEditMode(
            true
        );


        /*
           Fill ordinary fields first.
        */

        titleElement.value =
            media.title || "";


        typeElement.value =
            media.media_type || "";


        urlElement.value =
            media.media_url || "";


        descriptionElement.value =
            media.description || "";


        /*
           CRITICAL:

           Wait for source_cases to finish
           populating the dropdown before
           assigning source_id.
        */

        await loadGeneralMediaSources(
            caseId,
            media.source_id || ""
        );


        /*
           Scroll the form into view.
        */

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
   ADD / UPDATE MEDIA
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


    /*
       Validate URL.
    */

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

        const mediaPayload = {

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
                        {
                            title:
                                mediaPayload.title,

                            media_type:
                                mediaPayload.media_type,

                            media_url:
                                mediaPayload.media_url,

                            description:
                                mediaPayload.description,

                            source_id:
                                mediaPayload.source_id
                        }
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
                        mediaPayload
                    );


            if (error) {

                throw error;

            }


            setGeneralMediaMessage(
                "Media added successfully."
            );

        }


        /*
           Reset edit state.
        */

        generalMediaEditingId =
            null;


        setGeneralMediaEditMode(
            false
        );


        /*
           Clear form.
        */

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


        /*
           Reload source selector in normal
           state.
        */

        await loadGeneralMediaSources(
            caseId
        );


        /*
           Reload media list.
        */

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

    generalMediaEditingId =
        null;


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
   REMOVE MEDIA
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


        /*
           If the item being deleted is
           currently being edited, reset the
           form.
        */

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

    const form =
        document.getElementById(
            "media-form"
        );


    const cancelButton =
        document.getElementById(
            "media-cancel-button"
        );


    if (form) {

        /*
           Remove any previous listener that may
           have been attached by another version
           of this file.

           Cloning is safer here because this
           script may be reloaded while testing.
        */

        const freshForm =
            form.cloneNode(
                true
            );


        form.parentNode.replaceChild(
            freshForm,
            form
        );


        freshForm.addEventListener(
            "submit",
            saveGeneralMedia
        );

    }


    /*
       Re-fetch the cancel button because the
       form was cloned above.
    */

    const freshCancelButton =
        document.getElementById(
            "media-cancel-button"
        );


    if (freshCancelButton) {

        freshCancelButton.addEventListener(
            "click",
            cancelGeneralMediaEdit
        );

    }


    /*
       Initial form state.
    */

    generalMediaEditingId =
        null;


    setGeneralMediaEditMode(
        false
    );


    /*
       If a case is already selected when this
       script initializes, load its sources and
       media immediately.
    */

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
   CASE SELECTOR CHANGED
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

            /*
               Changing cases must always leave
               Edit mode.
            */

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