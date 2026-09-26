/* =========================================
   MENTAL HEALTH MANAGEMENT
   PERSON-BASED
   ========================================= */


/* =========================================
   STORAGE
   ========================================= */

const MENTAL_HEALTH_BUCKET =
    "mental-health-documents";


/* =========================================
   MENTAL HEALTH TAGS
   ========================================= */

async function loadMentalHealthTags(personId) {

    const list =
        document.getElementById(
            "mental-health-tag-list"
        );


    if (!list) {
        return;
    }


    if (!personId) {

        list.innerHTML =
            `<p class="empty-message">
                Select a person to view their mental health tags.
            </p>`;

        return;
    }


    list.innerHTML =
        "<p>Loading mental health tags...</p>";


    const { data, error } =
        await supabaseClient
            .from("case_mental_health_tags")
            .select(`
                id,
                person_id,
                tag_id,
                mental_health_tags (
                    id,
                    name,
                    description
                )
            `)
            .eq(
                "person_id",
                personId
            );


    if (error) {

        console.error(
            "Mental health tag loading error:",
            error
        );

        list.innerHTML =
            "<p>Unable to load mental health tags.</p>";

        return;
    }


    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            `<p class="empty-message">
                No mental health tags added yet.
            </p>`;

        return;
    }


    data.forEach(item => {

        if (!item.mental_health_tags) {
            return;
        }


        const tag =
            item.mental_health_tags;


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "manage-record";


        const title =
            document.createElement(
                "strong"
            );


        title.textContent =
            tag.name;


        card.appendChild(
            title
        );


        if (tag.description) {

            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                tag.description;


            card.appendChild(
                description
            );

        }


        const remove =
            document.createElement(
                "button"
            );


        remove.type =
            "button";


        remove.textContent =
            "Remove";


        remove.onclick =
            () => removeMentalHealthTag(
                personId,
                tag.id
            );


        card.appendChild(
            remove
        );


        list.appendChild(
            card
        );

    });

}


/* =========================================
   ADD MENTAL HEALTH TAG
   ========================================= */

async function addMentalHealthTag(event) {

    event.preventDefault();


    const personId =
        personSelector.value;


    const input =
        document.getElementById(
            "mental-health-tag-input"
        );


    const message =
        document.getElementById(
            "mental-health-tag-message"
        );


    if (!personId) {

        message.textContent =
            "Please select a person first.";

        return;
    }


    const tagName =
        input.value.trim();


    if (!tagName) {

        message.textContent =
            "Please enter a mental health tag.";

        return;
    }


    const {
        data: existingTag,
        error: tagSearchError
    } =
        await supabaseClient
            .from("mental_health_tags")
            .select("id, name")
            .ilike(
                "name",
                tagName
            )
            .maybeSingle();


    if (tagSearchError) {

        console.error(
            "Mental health tag search error:",
            tagSearchError
        );

        message.textContent =
            "Unable to check existing tags.";

        return;
    }


    let tagId;


    if (existingTag) {

        tagId =
            existingTag.id;

    } else {

        const {
            data: newTag,
            error: createError
        } =
            await supabaseClient
                .from("mental_health_tags")
                .insert({
                    name: tagName
                })
                .select()
                .single();


        if (createError) {

            console.error(
                "Mental health tag creation error:",
                createError
            );

            message.textContent =
                "Unable to create mental health tag.";

            return;
        }


        tagId =
            newTag.id;

    }


    const {
        data: existingConnection,
        error: connectionError
    } =
        await supabaseClient
            .from("case_mental_health_tags")
            .select(
                "person_id, tag_id"
            )
            .eq(
                "person_id",
                personId
            )
            .eq(
                "tag_id",
                tagId
            )
            .maybeSingle();


    if (connectionError) {

        console.error(
            "Mental health tag connection error:",
            connectionError
        );

        message.textContent =
            "Unable to check person tags.";

        return;
    }


    if (existingConnection) {

        message.textContent =
            "This tag is already attached to this person.";

        return;
    }


    const { error: insertError } =
        await supabaseClient
            .from("case_mental_health_tags")
            .insert({
                person_id: personId,
                tag_id: tagId
            });


    if (insertError) {

        console.error(
            "Mental health tag attachment error:",
            insertError
        );

        message.textContent =
            "Unable to add mental health tag.";

        return;
    }


    input.value = "";


    message.textContent =
        "Mental health tag added.";


    await loadMentalHealthTags(
        personId
    );

}


/* =========================================
   REMOVE MENTAL HEALTH TAG
   ========================================= */

async function removeMentalHealthTag(
    personId,
    tagId
) {

    if (
        !confirm(
            "Remove this mental health tag?"
        )
    ) {

        return;

    }


    const { error } =
        await supabaseClient
            .from("case_mental_health_tags")
            .delete()
            .eq(
                "person_id",
                personId
            )
            .eq(
                "tag_id",
                tagId
            );


    if (error) {

        console.error(
            "Mental health tag removal error:",
            error
        );

        alert(
            "Unable to remove mental health tag."
        );

        return;
    }


    await loadMentalHealthTags(
        personId
    );

}


/* =========================================
   MENTAL HEALTH DOCUMENTS
   ========================================= */

async function loadMentalHealthDocuments(personId) {

    const list =
        document.getElementById(
            "mental-health-document-list"
        );


    if (!list) {
        return;
    }


    if (!personId) {

        list.innerHTML =
            `<p class="empty-message">
                Select a person to view their mental health documents.
            </p>`;

        return;
    }


    list.innerHTML =
        "<p>Loading mental health documents...</p>";


    const { data, error } =
        await supabaseClient
            .from("mental_health_documents")
            .select(`
                *,
                sources (
                    id,
                    title
                )
            `)
            .eq(
                "person_id",
                personId
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Mental health document loading error:",
            error
        );

        list.innerHTML =
            "<p>Unable to load mental health documents.</p>";

        return;
    }


    list.innerHTML = "";


    if (!data || data.length === 0) {

        list.innerHTML =
            `<p class="empty-message">
                No mental health documents added yet.
            </p>`;

        return;
    }


    data.forEach(
        documentRecord => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "manage-record";


            /* ---------------------------------
               Title
               --------------------------------- */

            const title =
                document.createElement(
                    "strong"
                );


            title.textContent =
                documentRecord.title ||
                "Untitled document";


            card.appendChild(
                title
            );


            /* ---------------------------------
               Document type
               --------------------------------- */

            if (
                documentRecord.document_type
            ) {

                const type =
                    document.createElement(
                        "p"
                    );


                type.textContent =
                    `Type: ${documentRecord.document_type}`;


                card.appendChild(
                    type
                );

            }


            /* ---------------------------------
               Publication date
               --------------------------------- */

            if (
                documentRecord.publication_date
            ) {

                const date =
                    document.createElement(
                        "p"
                    );


                date.textContent =
                    `Publication date: ${documentRecord.publication_date}`;


                card.appendChild(
                    date
                );

            }


            /* ---------------------------------
               Description
               --------------------------------- */

            if (
                documentRecord.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    documentRecord.description;


                card.appendChild(
                    description
                );

            }


            /* ---------------------------------
               Source
               --------------------------------- */

            if (
                documentRecord.sources &&
                documentRecord.sources.title
            ) {

                const source =
                    document.createElement(
                        "p"
                    );


                source.textContent =
                    `Source: ${documentRecord.sources.title}`;


                card.appendChild(
                    source
                );

            }


            /* ---------------------------------
               Open PDF
               --------------------------------- */

            if (
                documentRecord.document_url
            ) {

                const link =
                    document.createElement(
                        "a"
                    );


                link.href =
                    documentRecord.document_url;


                link.target =
                    "_blank";


                link.rel =
                    "noopener noreferrer";


                link.textContent =
                    "Open PDF";


                card.appendChild(
                    link
                );

            }


            /* ---------------------------------
               Remove
               --------------------------------- */

            const remove =
                document.createElement(
                    "button"
                );


            remove.type =
                "button";


            remove.textContent =
                "Remove";


            remove.onclick =
                () => removeMentalHealthDocument(
                    documentRecord.id,
                    personId,
                    documentRecord.document_url
                );


            card.appendChild(
                remove
            );


            list.appendChild(
                card
            );

        }
    );

}


/* =========================================
   ADD MENTAL HEALTH DOCUMENT
   ========================================= */

async function addMentalHealthDocument(event) {

    event.preventDefault();


    const personId =
        personSelector.value;


    const message =
        document.getElementById(
            "mental-document-message"
        );


    if (!personId) {

        message.textContent =
            "Please select a person first.";

        return;
    }


    const title =
        document.getElementById(
            "mental-document-title"
        ).value.trim();


    const type =
        document.getElementById(
            "mental-document-type"
        ).value.trim() ||
        null;


    const publicationDate =
        document.getElementById(
            "mental-document-date"
        ).value ||
        null;


    const fileInput =
        document.getElementById(
            "mental-document-file"
        );


    const file =
        fileInput &&
        fileInput.files
            ? fileInput.files[0]
            : null;


    const description =
        document.getElementById(
            "mental-document-description"
        ).value.trim() ||
        null;


    const sourceElement =
        document.getElementById(
            "mental-document-source"
        );


    const sourceId =
        sourceElement &&
        sourceElement.value
            ? Number(
                sourceElement.value
            )
            : null;


    /* -----------------------------------------
       Validate title
       ----------------------------------------- */

    if (!title) {

        message.textContent =
            "Please enter a document title.";

        return;
    }


    /* -----------------------------------------
       Validate PDF
       ----------------------------------------- */

    if (!file) {

        message.textContent =
            "Please select a PDF document.";

        return;
    }


    if (
        file.type !==
        "application/pdf"
    ) {

        message.textContent =
            "Only PDF files are allowed.";

        return;
    }


    message.textContent =
        "Uploading PDF...";


    /* -----------------------------------------
       Create safe storage filename
       ----------------------------------------- */

    const originalName =
        file.name
            .replace(
                /\.pdf$/i,
                ""
            )
            .replace(
                /[^a-zA-Z0-9-_]/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            )
            .replace(
                /^-|-$/g,
                ""
            );


    const fileName =
        originalName ||
        "document";


    const filePath =
        `${personId}/${Date.now()}-${fileName}.pdf`;


    /* -----------------------------------------
       Upload PDF
       ----------------------------------------- */

    const {
        error: uploadError
    } =
        await supabaseClient
            .storage
            .from(
                MENTAL_HEALTH_BUCKET
            )
            .upload(
                filePath,
                file,
                {
                    contentType:
                        "application/pdf",

                    upsert:
                        false
                }
            );


    if (uploadError) {

        console.error(
            "Mental health PDF upload error:",
            uploadError
        );

        message.textContent =
            "Unable to upload PDF.";

        return;
    }


    /* -----------------------------------------
       Get public URL
       ----------------------------------------- */

    const {
        data: publicUrlData
    } =
        supabaseClient
            .storage
            .from(
                MENTAL_HEALTH_BUCKET
            )
            .getPublicUrl(
                filePath
            );


    const documentUrl =
        publicUrlData &&
        publicUrlData.publicUrl
            ? publicUrlData.publicUrl
            : null;


    if (!documentUrl) {

        console.error(
            "Unable to create PDF URL."
        );


        /* --------------------------------------
           Clean up uploaded file
           -------------------------------------- */

        await supabaseClient
            .storage
            .from(
                MENTAL_HEALTH_BUCKET
            )
            .remove([
                filePath
            ]);


        message.textContent =
            "Unable to create PDF link.";

        return;
    }


    message.textContent =
        "Saving document...";


    /* -----------------------------------------
       Save document record
       ----------------------------------------- */

    const {
        data: insertedDocument,
        error: insertError
    } =
        await supabaseClient
            .from("mental_health_documents")
            .insert({

                person_id:
                    personId,

                title:
                    title,

                document_url:
                    documentUrl,

                document_type:
                    type,

                publication_date:
                    publicationDate,

                description:
                    description,

                source_id:
                    sourceId

            })
            .select()
            .single();


    if (insertError) {

        console.error(
            "Mental health document insert error:",
            insertError
        );


        /* --------------------------------------
           Database insert failed.
           Remove uploaded PDF so we don't
           leave an orphaned file.
           -------------------------------------- */

        await supabaseClient
            .storage
            .from(
                MENTAL_HEALTH_BUCKET
            )
            .remove([
                filePath
            ]);


        message.textContent =
            "Unable to save mental health document.";

        return;
    }


    /* -----------------------------------------
       Reset form
       ----------------------------------------- */

    document.getElementById(
        "mental-health-document-form"
    ).reset();


    message.textContent =
        "Mental health PDF added.";


    await loadMentalHealthDocuments(
        personId
    );

}


/* =========================================
   REMOVE MENTAL HEALTH DOCUMENT
   ========================================= */

async function removeMentalHealthDocument(
    id,
    personId,
    documentUrl
) {

    if (
        !confirm(
            "Remove this mental health document?"
        )
    ) {

        return;

    }


    /* -----------------------------------------
       Delete database record
       ----------------------------------------- */

    const { error } =
        await supabaseClient
            .from("mental_health_documents")
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        console.error(
            "Mental health document deletion error:",
            error
        );

        alert(
            "Unable to remove document."
        );

        return;
    }


    /* -----------------------------------------
       Try to remove PDF from Storage
       ----------------------------------------- */

    if (documentUrl) {

        try {

            const marker =
                `/mental-health-documents/`;

            const markerIndex =
                documentUrl.indexOf(
                    marker
                );


            if (
                markerIndex !== -1
            ) {

                const filePath =
                    decodeURIComponent(
                        documentUrl.substring(
                            markerIndex +
                            marker.length
                        )
                    );


                await supabaseClient
                    .storage
                    .from(
                        MENTAL_HEALTH_BUCKET
                    )
                    .remove([
                        filePath
                    ]);

            }

        } catch (storageError) {

            console.error(
                "Mental health PDF storage deletion error:",
                storageError
            );

        }

    }


    await loadMentalHealthDocuments(
        personId
    );

}


/* =========================================
   LOAD SOURCES
   ========================================= */

async function loadMentalHealthDocumentSources(
    personId
) {

    const selector =
        document.getElementById(
            "mental-document-source"
        );


    if (!selector) {
        return;
    }


    selector.innerHTML =
        `<option value="">
            -- Select Source --
        </option>`;


    if (!personId) {
        return;
    }


    const { data, error } =
        await supabaseClient
            .from("sources")
            .select(
                "id, title"
            )
            .order(
                "title"
            );


    if (error) {

        console.error(
            "Mental health source loading error:",
            error
        );

        return;
    }


    if (!data) {
        return;
    }


    data.forEach(
        source => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                source.id;


            option.textContent =
                source.title;


            selector.appendChild(
                option
            );

        }
    );

}


/* =========================================
   FORM EVENT LISTENERS
   ========================================= */

const mentalHealthTagForm =
    document.getElementById(
        "mental-health-tag-form"
    );


if (mentalHealthTagForm) {

    mentalHealthTagForm.addEventListener(
        "submit",
        addMentalHealthTag
    );

}


const mentalHealthDocumentForm =
    document.getElementById(
        "mental-health-document-form"
    );


if (mentalHealthDocumentForm) {

    mentalHealthDocumentForm.addEventListener(
        "submit",
        addMentalHealthDocument
    );

}


/* =========================================
   PERSON SELECTOR
   ========================================= */

if (
    typeof personSelector !== "undefined"
) {

    personSelector.addEventListener(
        "change",
        () => {

            const personId =
                personSelector.value;


            loadMentalHealthTags(
                personId
            );


            loadMentalHealthDocuments(
                personId
            );


            loadMentalHealthDocumentSources(
                personId
            );

        }
    );

}


/* =========================================
   MAKE FUNCTIONS AVAILABLE
   ========================================= */

window.loadMentalHealthTags =
    loadMentalHealthTags;


window.loadMentalHealthDocuments =
    loadMentalHealthDocuments;


window.loadMentalHealthDocumentSources =
    loadMentalHealthDocumentSources;


window.addMentalHealthTag =
    addMentalHealthTag;


window.removeMentalHealthTag =
    removeMentalHealthTag;


window.addMentalHealthDocument =
    addMentalHealthDocument;


window.removeMentalHealthDocument =
    removeMentalHealthDocument;