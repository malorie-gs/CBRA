/* =========================================
   CBRA — CASE PAGE
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const SUPABASE_URL =
    "https://xjbysfrceqtljatsijsy.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_iRC9CutWA2fMgucVMtiOEw_f7uSu-3W";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* -----------------------------------------
   BASIC HELPERS
   ----------------------------------------- */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {
        element.textContent = "—";
        return;
    }

    element.textContent = value;

}


/* -----------------------------------------
   ESCAPE HTML
   ----------------------------------------- */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* -----------------------------------------
   FORMAT DATE
   ----------------------------------------- */

function formatDate(dateValue) {

    if (!dateValue) {
        return "—";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


/* -----------------------------------------
   EXTERNAL LINK
   ----------------------------------------- */

function createExternalLink(
    url,
    label = "View Source"
) {

    if (!url) {
        return "—";
    }

    return `
        <a
            href="${escapeHTML(url)}"
            target="_blank"
            rel="noopener noreferrer"
        >
            ${escapeHTML(label)}
        </a>
    `;

}


/* -----------------------------------------
   EMPTY STATE
   ----------------------------------------- */

function showEmpty(
    containerId,
    message = "No information available."
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) return;

    container.innerHTML = `
        <div class="empty-state">
            ${escapeHTML(message)}
        </div>
    `;

}


/* -----------------------------------------
   GET CASE ID
   ----------------------------------------- */

const params =
    new URLSearchParams(
        window.location.search
    );

const caseId =
    params.get("id");


/* -----------------------------------------
   LOAD CASE
   ----------------------------------------- */

async function loadCase() {

    if (!caseId) {

        console.error(
            "CBRA: No case ID was provided."
        );

        return;

    }

    const {
        data: caseData,
        error
    } =
        await supabaseClient
            .from("cases")
            .select(`
                id,
                case_name,
                case_date,
                country,
                state_province,
                city,
                classification,
                offense,
                additional_offenses,
                outcome,
                victim_count,
                fatality_count,
                description
            `)
            .eq(
                "id",
                caseId
            )
            .single();

    if (error) {

        console.error(
            "CBRA: Error loading case:",
            error
        );

        return;

    }

    if (!caseData) {

        console.error(
            "CBRA: Case not found."
        );

        return;

    }


    /* -----------------------------------------
       HEADER
       ----------------------------------------- */

    setText(
        "case-name",
        caseData.case_name
    );

    setText(
        "case-location",
        [
            caseData.city,
            caseData.state_province,
            caseData.country
        ]
            .filter(Boolean)
            .join(", ")
    );

    setText(
        "case-date-header",
        formatDate(
            caseData.case_date
        )
    );


    /* -----------------------------------------
       CASE INFORMATION
       ----------------------------------------- */

    setText(
        "case-date",
        formatDate(
            caseData.case_date
        )
    );

    setText(
        "case-country",
        caseData.country
    );

    setText(
        "case-state",
        caseData.state_province
    );

    setText(
        "case-city",
        caseData.city
    );

    setText(
        "case-classification",
        caseData.classification
    );

    setText(
        "case-offense",
        caseData.offense
    );

    setText(
        "case-outcome",
        caseData.outcome
    );

    setText(
        "case-victims",
        caseData.victim_count
    );

    setText(
        "case-fatalities",
        caseData.fatality_count
    );

    setText(
        "case-description",
        caseData.description
    );


    /* -----------------------------------------
       ADDITIONAL OFFENSES
       ----------------------------------------- */

    const additionalContainer =
        document.getElementById(
            "case-additional-offenses"
        );

    if (additionalContainer) {

        if (
            !caseData.additional_offenses ||
            String(
                caseData.additional_offenses
            ).trim() === ""
        ) {

            additionalContainer.textContent = "—";

        } else {

            const offenses =
                String(
                    caseData.additional_offenses
                )
                    .split(/\s*(?:,|;|\n)\s*/)
                    .map(
                        offense =>
                            offense.trim()
                    )
                    .filter(Boolean);

            additionalContainer.innerHTML = `
                <ul class="additional-offenses-list">
                    ${
                        offenses
                            .map(
                                offense => `
                                    <li>
                                        ${escapeHTML(
                                            offense
                                        )}
                                    </li>
                                `
                            )
                            .join("")
                    }
                </ul>
            `;

        }

    }

}


/* -----------------------------------------
   LOAD PEOPLE
   ----------------------------------------- */

async function loadPeople() {

    const container =
        document.getElementById(
            "case-people"
        );

    if (!container) return;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_people")
            .select(`
                role,
                person:people (
                    id,
                    display_name,
                    date_of_birth,
                    age_at_case,
                    gender
                )
            `)
            .eq(
                "case_id",
                caseId
            );

    if (error) {

        console.error(
            "CBRA: Error loading people:",
            error
        );

        showEmpty(
            "case-people",
            "Unable to load people."
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            "case-people",
            "No people are linked to this case."
        );

        return;

    }

    const html =
        data
            .map(item => {

                const person =
                    item.person;

                if (!person) {
                    return "";
                }

                return `
                    <div class="person-card">

                        <h3>
                            <a
                                href="person.html?id=${encodeURIComponent(
                                    person.id
                                )}"
                            >
                                ${escapeHTML(
                                    person.display_name ||
                                    "Unnamed Person"
                                )}
                            </a>
                        </h3>

                        <p>
                            <strong>Role:</strong>
                            ${escapeHTML(
                                item.role ||
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Age:</strong>
                            ${escapeHTML(
                                person.age_at_case ??
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Date of Birth:</strong>
                            ${
                                person.date_of_birth
                                    ? escapeHTML(
                                        formatDate(
                                            person.date_of_birth
                                        )
                                    )
                                    : "—"
                            }
                        </p>

                        <p>
                            <strong>Gender:</strong>
                            ${escapeHTML(
                                person.gender ||
                                "—"
                            )}
                        </p>

                    </div>
                `;

            })
            .join("");

    container.innerHTML =
        html ||
        `<div class="empty-state">No people are linked to this case.</div>`;

}


/* -----------------------------------------
   LOAD TAGS
   ----------------------------------------- */

async function loadTags() {

    const {
        data: caseTags,
        error: caseTagError
    } =
        await supabaseClient
            .from("case_tags")
            .select(`
                tag_id
            `)
            .eq(
                "case_id",
                caseId
            );

    if (caseTagError) {

        console.error(
            "CBRA: Error loading case tags:",
            caseTagError
        );

        showEmpty(
            "case-crime-tags",
            "Unable to load tags."
        );

        showEmpty(
            "case-influence-tags",
            "Unable to load tags."
        );

        showEmpty(
            "case-mental-health-tags",
            "Unable to load tags."
        );

        return;

    }

    if (!caseTags || caseTags.length === 0) {

        showEmpty(
            "case-crime-tags",
            "No crime tags are linked to this case."
        );

        showEmpty(
            "case-influence-tags",
            "No influence tags are linked to this case."
        );

        showEmpty(
            "case-mental-health-tags",
            "No mental-health tags are linked to this case."
        );

        return;

    }

    const tagIds =
        caseTags
            .map(
                item => item.tag_id
            )
            .filter(Boolean);

    if (tagIds.length === 0) {
        return;
    }

    const {
        data: tags,
        error: tagError
    } =
        await supabaseClient
            .from("tags")
            .select(`
                id,
                name,
                category
            `)
            .in(
                "id",
                tagIds
            );

    if (tagError) {

        console.error(
            "CBRA: Error loading tag details:",
            tagError
        );

        return;

    }

    if (!tags || tags.length === 0) {
        return;
    }

    const containers = {
        crime:
            document.getElementById(
                "case-crime-tags"
            ),

        influence:
            document.getElementById(
                "case-influence-tags"
            ),

        mental_health:
            document.getElementById(
                "case-mental-health-tags"
            )
    };

    Object.values(containers)
        .forEach(container => {

            if (container) {
                container.innerHTML = "";
            }

        });

    tags
        .sort(
            (a, b) =>
                (a.name || "")
                    .localeCompare(
                        b.name || ""
                    )
        )
        .forEach(tag => {

            const container =
                containers[
                    tag.category
                ];

            if (!container) {
                return;
            }

            const link =
                document.createElement("a");

            link.className =
                "case-tag";

            link.href =
                "archive.html?tag=" +
                encodeURIComponent(
                    tag.name
                );

            link.textContent =
                tag.name;

            container.appendChild(
                link
            );

        });

    Object.entries(containers)
        .forEach(
            ([category, container]) => {

                if (
                    container &&
                    container.children.length === 0
                ) {

                    const labels = {
                        crime:
                            "No crime tags are linked to this case.",

                        influence:
                            "No influence tags are linked to this case.",

                        mental_health:
                            "No mental-health tags are linked to this case."
                    };

                    container.innerHTML = `
                        <div class="empty-state">
                            ${escapeHTML(
                                labels[category]
                            )}
                        </div>
                    `;

                }

            }
        );

}


/* -----------------------------------------
   LOAD CRIME SCENE PHOTOS
   ----------------------------------------- */

async function loadCrimeScenePhotos() {

    const container =
        document.getElementById(
            "case-crime-scene-photos"
        );

    if (!container) return;

    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "case_crime_scene_photos"
            )
            .select(`
                id,
                title,
                image_url,
                date_taken,
                description,
                source_id
            `)
            .eq(
                "case_id",
                caseId
            );

    if (error) {

        console.error(
            "CBRA: Error loading crime scene photos:",
            error
        );

        showEmpty(
            "case-crime-scene-photos",
            "Unable to load crime scene photos."
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            "case-crime-scene-photos",
            "No crime scene photos are available."
        );

        return;

    }

    data.sort(
        (a, b) => {

            if (!a.date_taken) return 1;

            if (!b.date_taken) return -1;

            return (
                new Date(a.date_taken) -
                new Date(b.date_taken)
            );

        }
    );

    container.innerHTML =
        data
            .map(photo => {

                return `
                    <div class="crime-scene-photo-card">

                        <div class="crime-scene-photo-image">

                            <img
                                src="${escapeHTML(
                                    photo.image_url
                                )}"
                                alt="${escapeHTML(
                                    photo.title ||
                                    "Crime scene photo"
                                )}"
                                loading="lazy"
                            >

                        </div>

                        <div class="crime-scene-photo-info">

                            <h3>
                                ${escapeHTML(
                                    photo.title ||
                                    "Untitled Photo"
                                )}
                            </h3>

                            <p>
                                <strong>Date Taken:</strong>
                                ${
                                    photo.date_taken
                                        ? escapeHTML(
                                            formatDate(
                                                photo.date_taken
                                            )
                                        )
                                        : "—"
                                }
                            </p>

                            ${
                                photo.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                photo.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                    </div>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD MEDIA
   ----------------------------------------- */

async function loadMedia() {

    const container =
        document.getElementById(
            "case-media"
        );

    if (!container) return;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_media")
            .select(`
                id,
                title,
                media_type,
                description,
                media_url,
                source_id
            `)
            .eq(
                "case_id",
                caseId
            );

    if (error) {

        console.error(
            "CBRA: Error loading media:",
            error
        );

        showEmpty(
            "case-media",
            "Unable to load media."
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            "case-media",
            "No media is available."
        );

        return;

    }

    const sourceIds =
        data
            .map(
                media => media.source_id
            )
            .filter(Boolean);

    let sources = [];

    if (sourceIds.length > 0) {

        const {
            data: sourceData,
            error: sourceError
        } =
            await supabaseClient
                .from("sources")
                .select(`
                    id,
                    title,
                    url
                `)
                .in(
                    "id",
                    sourceIds
                );

        if (sourceError) {

            console.warn(
                "CBRA: Could not load media sources:",
                sourceError
            );

        } else {

            sources =
                sourceData || [];

        }

    }

    const sourceMap =
        new Map(
            sources.map(
                source => [
                    source.id,
                    source
                ]
            )
        );

    container.innerHTML =
        data
            .map(media => {

                const source =
                    media.source_id
                        ? sourceMap.get(
                            media.source_id
                        )
                        : null;

                return `
                    <div class="media-card">

                        <h3>
                            ${escapeHTML(
                                media.title ||
                                "Untitled Media"
                            )}
                        </h3>

                        <p>
                            <strong>Type:</strong>
                            ${escapeHTML(
                                media.media_type ||
                                "—"
                            )}
                        </p>

                        ${
                            media.description
                                ? `
                                    <p>
                                        ${escapeHTML(
                                            media.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            media.media_url
                                ? createExternalLink(
                                    media.media_url,
                                    "Open Media"
                                )
                                : ""
                        }

                        ${
                            source
                                ? `
                                    <p>
                                        <strong>Source:</strong>
                                        ${escapeHTML(
                                            source.title ||
                                            "Untitled Source"
                                        )}
                                    </p>

                                    ${
                                        source.url
                                            ? createExternalLink(
                                                source.url,
                                                "View Source"
                                            )
                                            : ""
                                    }
                                `
                                : ""
                        }

                    </div>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD DOCUMENTS
   ----------------------------------------- */

async function loadDocuments() {

    const container =
        document.getElementById(
            "case-documents"
        );

    if (!container) return;

    const {
        data: documentCases,
        error: documentCaseError
    } =
        await supabaseClient
            .from("document_cases")
            .select(`
                document_id
            `)
            .eq(
                "case_id",
                caseId
            );

    if (documentCaseError) {

        console.error(
            "CBRA: Error loading document links:",
            documentCaseError
        );

        showEmpty(
            "case-documents",
            "Unable to load documents."
        );

        return;

    }

    if (
        !documentCases ||
        documentCases.length === 0
    ) {

        showEmpty(
            "case-documents",
            "No documents are linked to this case."
        );

        return;

    }

    const documentIds =
        documentCases
            .map(
                item =>
                    item.document_id
            )
            .filter(Boolean);

    const {
        data: documents,
        error
    } =
        await supabaseClient
            .from("documents")
            .select(`
                id,
                title,
                document_type,
                publication_date,
                description,
                document_url,
                source_id
            `)
            .in(
                "id",
                documentIds
            );

    if (error) {

        console.error(
            "CBRA: Error loading documents:",
            error
        );

        showEmpty(
            "case-documents",
            "Unable to load documents."
        );

        return;

    }

    if (!documents || documents.length === 0) {

        showEmpty(
            "case-documents",
            "No documents are available."
        );

        return;

    }

    const sourceIds =
        documents
            .map(
                document =>
                    document.source_id
            )
            .filter(Boolean);

    let sources = [];

    if (sourceIds.length > 0) {

        const {
            data: sourceData
        } =
            await supabaseClient
                .from("sources")
                .select(`
                    id,
                    title,
                    url
                `)
                .in(
                    "id",
                    sourceIds
                );

        sources =
            sourceData || [];

    }

    const sourceMap =
        new Map(
            sources.map(
                source => [
                    source.id,
                    source
                ]
            )
        );

    documents.sort(
        (a, b) => {

            if (!a.publication_date) return 1;

            if (!b.publication_date) return -1;

            return (
                new Date(
                    b.publication_date
                ) -
                new Date(
                    a.publication_date
                )
            );

        }
    );

    container.innerHTML =
        documents
            .map(document => {

                const source =
                    document.source_id
                        ? sourceMap.get(
                            document.source_id
                        )
                        : null;

                return `
                    <div class="document-card">

                        <h3>
                            ${escapeHTML(
                                document.title ||
                                "Untitled Document"
                            )}
                        </h3>

                        <p>
                            <strong>Type:</strong>
                            ${escapeHTML(
                                document.document_type ||
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Publication Date:</strong>
                            ${
                                document.publication_date
                                    ? escapeHTML(
                                        formatDate(
                                            document.publication_date
                                        )
                                    )
                                    : "—"
                            }
                        </p>

                        ${
                            document.description
                                ? `
                                    <p>
                                        ${escapeHTML(
                                            document.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            document.document_url
                                ? createExternalLink(
                                    document.document_url,
                                    "View Document"
                                )
                                : ""
                        }

                        ${
                            source
                                ? `
                                    <p>
                                        <strong>Source:</strong>
                                        ${escapeHTML(
                                            source.title ||
                                            "Untitled Source"
                                        )}
                                    </p>

                                    ${
                                        source.url
                                            ? createExternalLink(
                                                source.url,
                                                "View Source"
                                            )
                                            : ""
                                    }
                                `
                                : ""
                        }

                    </div>
                `;

            })
            .join("");

}

/* -----------------------------------------
   LOAD CASE SOURCES
   ----------------------------------------- */

async function loadCaseSources() {

    const container =
        document.getElementById(
            "case-sources"
        );

    if (!container) return;


    /* -----------------------------------------
       LOAD SOURCE/CASE RELATIONSHIPS
       ----------------------------------------- */

    const {
        data: sourceCases,
        error: sourceCaseError
    } =
        await supabaseClient
            .from("source_cases")
            .select(`
                source_id
            `)
            .eq(
                "case_id",
                caseId
            );


    if (sourceCaseError) {

        console.error(
            "CBRA: Error loading source_cases:",
            sourceCaseError
        );

        showEmpty(
            "case-sources",
            "Unable to load sources."
        );

        return;

    }


    /* -----------------------------------------
       NO RELATIONSHIPS
       ----------------------------------------- */

    if (
        !sourceCases ||
        sourceCases.length === 0
    ) {

        console.warn(
            "CBRA: No source_cases rows found for case:",
            caseId
        );

        showEmpty(
            "case-sources",
            "No sources are linked to this case."
        );

        return;

    }


    /* -----------------------------------------
       GET SOURCE IDS
       ----------------------------------------- */

    const sourceIds =
        sourceCases
            .map(
                relationship =>
                    relationship.source_id
            )
            .filter(
                sourceId =>
                    sourceId !== null &&
                    sourceId !== undefined
            );


    if (sourceIds.length === 0) {

        console.warn(
            "CBRA: source_cases rows exist, but no source IDs were found for case:",
            caseId
        );

        showEmpty(
            "case-sources",
            "No sources are linked to this case."
        );

        return;

    }


    console.log(
        "CBRA: Source IDs for case",
        caseId,
        sourceIds
    );


    /* -----------------------------------------
       LOAD SOURCES
       ----------------------------------------- */

    const {
        data: sources,
        error: sourceError
    } =
        await supabaseClient
            .from("sources")
            .select(`
                id,
                title,
                url,
                source_type,
                publication_date
            `)
            .in(
                "id",
                sourceIds
            );


    if (sourceError) {

        console.error(
            "CBRA: Error loading source records:",
            sourceError
        );

        showEmpty(
            "case-sources",
            "Unable to load sources."
        );

        return;

    }


    /* -----------------------------------------
       SOURCE RECORDS NOT FOUND
       ----------------------------------------- */

    if (
        !sources ||
        sources.length === 0
    ) {

        console.warn(
            "CBRA: source_cases found source IDs, but no matching sources were returned.",
            {
                caseId: caseId,
                sourceIds: sourceIds
            }
        );

        showEmpty(
            "case-sources",
            "The linked source records could not be found."
        );

        return;

    }


    /* -----------------------------------------
       SORT SOURCES
       ----------------------------------------- */

    sources.sort(
        (a, b) => {

            if (!a.publication_date) return 1;

            if (!b.publication_date) return -1;

            return (
                new Date(
                    b.publication_date
                ) -
                new Date(
                    a.publication_date
                )
            );

        }
    );


    /* -----------------------------------------
       DISPLAY SOURCES
       ----------------------------------------- */

    container.innerHTML =
        sources
            .map(source => {

                return `
                    <div class="source-card">

                        <h3>
                            ${escapeHTML(
                                source.title ||
                                "Untitled Source"
                            )}
                        </h3>

                        <p>
                            <strong>Type:</strong>
                            ${escapeHTML(
                                source.source_type ||
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Publication Date:</strong>
                            ${
                                source.publication_date
                                    ? escapeHTML(
                                        formatDate(
                                            source.publication_date
                                        )
                                    )
                                    : "—"
                            }
                        </p>

                        ${
                            source.url
                                ? createExternalLink(
                                    source.url,
                                    "View Source"
                                )
                                : ""
                        }

                    </div>
                `;

            })
            .join("");

}

/* -----------------------------------------
   LOAD LINKS
   ----------------------------------------- */

async function loadLinks() {

    const container =
        document.getElementById(
            "case-links"
        );

    if (!container) return;

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_links")
            .select(`
                id,
                title,
                url,
                description
            `)
            .eq(
                "case_id",
                caseId
            );

    if (error) {

        console.error(
            "CBRA: Error loading links:",
            error
        );

        showEmpty(
            "case-links",
            "Unable to load links."
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            "case-links",
            "No additional links are available."
        );

        return;

    }

    container.innerHTML =
        data
            .map(link => {

                return `
                    <div class="case-link-card">

                        <h3>
                            ${escapeHTML(
                                link.title ||
                                "Untitled Link"
                            )}
                        </h3>

                        ${
                            link.description
                                ? `
                                    <p>
                                        ${escapeHTML(
                                            link.description
                                        )}
                                    </p>
                                `
                                : ""
                        }

                        ${
                            link.url
                                ? createExternalLink(
                                    link.url,
                                    "Open Link"
                                )
                                : ""
                        }

                    </div>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD RELATED CASES
   ----------------------------------------- */

async function loadRelatedCases() {

    const container =
        document.getElementById(
            "case-related"
        );

    if (!container) return;

    const {
        data: relationships,
        error: relationshipError
    } =
        await supabaseClient
            .from("related_cases")
            .select(`
                related_case_id,
                relationship_type
            `)
            .eq(
                "case_id",
                caseId
            );

    if (relationshipError) {

        console.error(
            "CBRA: Error loading related cases:",
            relationshipError
        );

        showEmpty(
            "case-related",
            "Unable to load related cases."
        );

        return;

    }

    if (
        !relationships ||
        relationships.length === 0
    ) {

        showEmpty(
            "case-related",
            "No related cases are linked."
        );

        return;

    }

    const relatedCaseIds =
        relationships
            .map(
                relationship =>
                    relationship.related_case_id
            )
            .filter(Boolean);

    const {
        data: cases,
        error: caseError
    } =
        await supabaseClient
            .from("cases")
            .select(`
                id,
                case_name,
                case_date,
                classification,
                offense
            `)
            .in(
                "id",
                relatedCaseIds
            );

    if (caseError) {

        console.error(
            "CBRA: Error loading related case details:",
            caseError
        );

        showEmpty(
            "case-related",
            "Unable to load related cases."
        );

        return;

    }

    if (!cases || cases.length === 0) {

        showEmpty(
            "case-related",
            "No related cases were found."
        );

        return;

    }

    const caseMap =
        new Map(
            cases.map(
                relatedCase => [
                    relatedCase.id,
                    relatedCase
                ]
            )
        );

    container.innerHTML =
        relationships
            .map(relationship => {

                const relatedCase =
                    caseMap.get(
                        relationship.related_case_id
                    );

                if (!relatedCase) {
                    return "";
                }

                return `
                    <div class="related-case-card">

                        <h3>

                            <a
                                href="case.html?id=${encodeURIComponent(
                                    relatedCase.id
                                )}"
                            >
                                ${escapeHTML(
                                    relatedCase.case_name ||
                                    "Unnamed Case"
                                )}
                            </a>

                        </h3>

                        <p>
                            <strong>Relationship:</strong>
                            ${escapeHTML(
                                relationship.relationship_type ||
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${
                                relatedCase.case_date
                                    ? escapeHTML(
                                        formatDate(
                                            relatedCase.case_date
                                        )
                                    )
                                    : "—"
                            }
                        </p>

                        <p>
                            <strong>Classification:</strong>
                            ${escapeHTML(
                                relatedCase.classification ||
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Primary Offense:</strong>
                            ${escapeHTML(
                                relatedCase.offense ||
                                "—"
                            )}
                        </p>

                    </div>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD EVERYTHING
   ----------------------------------------- */

loadCase();
loadPeople();
loadTags();
loadCrimeScenePhotos();
loadMedia();
loadDocuments();
loadCaseSources();
loadLinks();
loadRelatedCases();