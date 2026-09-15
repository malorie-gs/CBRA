const SUPABASE_URL = "https://xjbysfrceqtljatsijsy.supabase.co";

const SUPABASE_KEY = "sb_publishable_iRC9CutWA2fMgucVMtiOEw_f7uSu-3W";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// --------------------------------------------------
// BASIC HELPERS
// --------------------------------------------------

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        element.textContent = "—";

    } else {

        element.textContent = value;

    }

}


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


function formatDate(date) {

    if (!date) {

        return "—";

    }

    const parsed =
        new Date(date);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {

        return date;

    }

    return parsed.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


function createExternalLink(
    url,
    text
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
            ${escapeHTML(text || url)}
        </a>
    `;

}


function showEmpty(
    containerId,
    message
) {

    const container =
        document.getElementById(
            containerId
        );

    if (!container) return;

    container.innerHTML = `
        <p class="empty-message">
            ${escapeHTML(message)}
        </p>
    `;

}


// --------------------------------------------------
// GET CASE ID
// --------------------------------------------------

const urlParams =
    new URLSearchParams(
        window.location.search
    );

const caseId =
    urlParams.get("id");


if (!caseId) {

    document.title =
        "Case Not Found | CBRA";

    const nameElement =
        document.getElementById(
            "case-name"
        );

    if (nameElement) {

        nameElement.textContent =
            "Case not found";

    }

    throw new Error(
        "No case ID was supplied in the URL."
    );

}


// --------------------------------------------------
// LOAD CASE
// --------------------------------------------------

async function loadCase() {

    try {

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
                    description,
                    offense,
                    additional_offenses,
                    classification,
                    outcome,
                    victim_count,
                    fatality_count
                `)
                .eq(
                    "id",
                    caseId
                )
                .single();


        if (error) {

            throw error;

        }


        if (!caseData) {

            throw new Error(
                "Case not found."
            );

        }


        // ------------------------------------------
        // PAGE TITLE
        // ------------------------------------------

        document.title =
            `${caseData.case_name} | CBRA`;


        // ------------------------------------------
        // HEADER
        // ------------------------------------------

        setText(
            "case-name",
            caseData.case_name
        );


        const locationParts = [

            caseData.city,
            caseData.state_province,
            caseData.country

        ].filter(Boolean);


        setText(
            "case-location",
            locationParts.length
                ? locationParts.join(", ")
                : "Location not documented"
        );


        setText(
            "case-date-header",
            formatDate(
                caseData.case_date
            )
        );


        // ------------------------------------------
        // CASE INFORMATION
        // ------------------------------------------

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
            "case-additional-offenses",
            caseData.additional_offenses
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


        // ------------------------------------------
        // DESCRIPTION
        // ------------------------------------------

        setText(
            "case-description",
            caseData.description
        );


        // ------------------------------------------
        // LOAD CASE SECTIONS
        // ------------------------------------------

        await Promise.all([

            loadPeople(),

            loadTags(),

            loadCrimeScenePhotos(),

            loadMedia(),

            loadDocuments(),

            loadSources(),

            loadLinks(),

            loadRelatedCases()

        ]);


    } catch (error) {

        console.error(
            "Error loading case:",
            error
        );


        const nameElement =
            document.getElementById(
                "case-name"
            );


        if (nameElement) {

            nameElement.textContent =
                "Unable to load case";

        }


        const locationElement =
            document.getElementById(
                "case-location"
            );


        if (locationElement) {

            locationElement.textContent =
                "There was a problem loading this case.";

        }

    }

}


// --------------------------------------------------
// PEOPLE INVOLVED
// --------------------------------------------------

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
                id,
                role,
                person_id,
                people (
                    id,
                    display_name,
                    age_at_case,
                    date_of_birth,
                    gender
                )
            `)
            .eq(
                "case_id",
                caseId
            );


    if (error) {

        console.error(
            "Error loading people:",
            error
        );


        showEmpty(
            "case-people",
            "Unable to load people associated with this case."
        );

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        showEmpty(
            "case-people",
            "No people have been added to this case."
        );

        return;

    }


    const sortedPeople =
        [...data].sort(
            (a, b) => {

                const roleA =
                    (a.role || "")
                        .toLowerCase();

                const roleB =
                    (b.role || "")
                        .toLowerCase();

                return roleA.localeCompare(
                    roleB
                );

            }
        );


    container.innerHTML =
        sortedPeople
            .map(
                connection => {

                    const person =
                        connection.people;

                    if (!person) {

                        return "";

                    }


                    const personId =
                        person.id;


                    const personName =
                        person.display_name ||
                        "Unnamed Person";


                    return `

                        <article class="person-card">

                            <a
                                class="person-card-link"
                                href="person.html?id=${encodeURIComponent(personId)}"
                            >

                                <h3>
                                    ${escapeHTML(personName)}
                                </h3>

                            </a>


                            <div class="person-card-details">

                                ${
                                    connection.role
                                        ? `
                                            <div>

                                                <span class="person-detail-label">
                                                    Role
                                                </span>

                                                <span>
                                                    ${escapeHTML(connection.role)}
                                                </span>

                                            </div>
                                        `
                                        : ""
                                }


                                ${
                                    person.age_at_case !== null &&
                                    person.age_at_case !== undefined
                                        ? `
                                            <div>

                                                <span class="person-detail-label">
                                                    Age at Case
                                                </span>

                                                <span>
                                                    ${escapeHTML(person.age_at_case)}
                                                </span>

                                            </div>
                                        `
                                        : ""
                                }


                                ${
                                    person.date_of_birth
                                        ? `
                                            <div>

                                                <span class="person-detail-label">
                                                    Date of Birth
                                                </span>

                                                <span>
                                                    ${escapeHTML(
                                                        formatDate(
                                                            person.date_of_birth
                                                        )
                                                    )}
                                                </span>

                                            </div>
                                        `
                                        : ""
                                }


                                ${
                                    person.gender
                                        ? `
                                            <div>

                                                <span class="person-detail-label">
                                                    Gender
                                                </span>

                                                <span>
                                                    ${escapeHTML(person.gender)}
                                                </span>

                                            </div>
                                        `
                                        : ""
                                }

                            </div>

                        </article>

                    `;

                }
            )
            .join("");

}


// --------------------------------------------------
// CASE RESEARCH TAGS
// --------------------------------------------------

async function loadTags() {

    const crimeContainer =
        document.getElementById(
            "case-crime-tags"
        );

    const influenceContainer =
        document.getElementById(
            "case-influence-tags"
        );

    const mentalHealthContainer =
        document.getElementById(
            "case-mental-health-tags"
        );

    const demographicContainer =
        document.getElementById(
            "case-demographic-tags"
        );


    // ------------------------------------------
    // LOAD TAG CONNECTIONS
    // ------------------------------------------

    const {
        data,
        error
    } =
        await supabaseClient
            .from("case_tags")
            .select(`
                tag_id,
                tags (
                    id,
                    name,
                    category
                )
            `)
            .eq(
                "case_id",
                caseId
            );


    if (error) {

        console.error(
            "Error loading case research tags:",
            error
        );


        if (crimeContainer) {

            showEmpty(
                "case-crime-tags",
                "Unable to load crime tags."
            );

        }


        if (influenceContainer) {

            showEmpty(
                "case-influence-tags",
                "Unable to load influence tags."
            );

        }


        if (mentalHealthContainer) {

            showEmpty(
                "case-mental-health-tags",
                "Unable to load mental-health tags."
            );

        }


        if (demographicContainer) {

            showEmpty(
                "case-demographic-tags",
                "Unable to load demographic tags."
            );

        }

        return;

    }


    // ------------------------------------------
    // ORGANIZE BY CATEGORY
    // ------------------------------------------

    const crimeTags = [];

    const influenceTags = [];

    const mentalHealthTags = [];

    const demographicTags = [];


    (data || []).forEach(
        item => {

            if (
                !item.tags ||
                !item.tags.id ||
                !item.tags.name
            ) {

                return;

            }


            const tag =
                item.tags;


            if (
                tag.category === "crime"
            ) {

                crimeTags.push(tag);

            } else if (
                tag.category === "influence"
            ) {

                influenceTags.push(tag);

            } else if (
                tag.category === "mental_health"
            ) {

                mentalHealthTags.push(tag);

            } else if (
                tag.category === "demographic"
            ) {

                demographicTags.push(tag);

            }

        }
    );


    // ------------------------------------------
    // SORT TAGS
    // ------------------------------------------

    const sortTags =
        tags => {

            return tags.sort(
                (a, b) =>
                    (a.name || "")
                        .localeCompare(
                            b.name || ""
                        )
            );

        };


    sortTags(crimeTags);

    sortTags(influenceTags);

    sortTags(mentalHealthTags);

    sortTags(demographicTags);


    // ------------------------------------------
    // DISPLAY HELPER
    // ------------------------------------------

    function renderTags(
        container,
        tags,
        emptyMessage
    ) {

        if (!container) return;


        if (
            !tags ||
            tags.length === 0
        ) {

            showEmpty(
                container.id,
                emptyMessage
            );

            return;

        }


        container.innerHTML = `
            <div class="tag-list">

                ${
                    tags
                        .map(
                            tag => `
                                <a
                                    class="case-tag"
                                    href="archive.html?tag=${encodeURIComponent(
                                        tag.id
                                    )}"
                                >
                                    ${escapeHTML(tag.name)}
                                </a>
                            `
                        )
                        .join("")
                }

            </div>
        `;

    }


    // ------------------------------------------
    // DISPLAY EACH CATEGORY
    // ------------------------------------------

    renderTags(
        crimeContainer,
        crimeTags,
        "No crime tags have been added."
    );


    renderTags(
        influenceContainer,
        influenceTags,
        "No influence tags have been added."
    );


    renderTags(
        mentalHealthContainer,
        mentalHealthTags,
        "No mental-health tags have been added."
    );


    renderTags(
        demographicContainer,
        demographicTags,
        "No demographic tags have been added."
    );

}


// --------------------------------------------------
// CRIME SCENE PHOTOS
// --------------------------------------------------

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
            )
            .order(
                "date_taken",
                {
                    ascending: true,
                    nullsFirst: false
                }
            );


    if (error) {

        console.error(
            "Crime scene photos are not available yet:",
            error
        );


        showEmpty(
            "case-crime-scene-photos",
            "No crime scene photos have been added to this case."
        );

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        showEmpty(
            "case-crime-scene-photos",
            "No crime scene photos have been added to this case."
        );

        return;

    }


    container.innerHTML =
        data
            .map(
                photo => {

                    return `

                        <article class="crime-scene-photo-card">

                            <div class="crime-scene-image-wrapper">

                                <a
                                    href="${escapeHTML(photo.image_url)}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >

                                    <img
                                        src="${escapeHTML(photo.image_url)}"
                                        alt="${escapeHTML(
                                            photo.title ||
                                            "Crime scene photograph"
                                        )}"
                                        loading="lazy"
                                    >

                                </a>

                            </div>


                            <div class="crime-scene-photo-info">

                                <h3>
                                    ${escapeHTML(
                                        photo.title ||
                                        "Untitled Photograph"
                                    )}
                                </h3>


                                ${
                                    photo.date_taken
                                        ? `
                                            <p class="photo-date">
                                                ${escapeHTML(
                                                    formatDate(
                                                        photo.date_taken
                                                    )
                                                )}
                                            </p>
                                        `
                                        : ""
                                }


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

                        </article>

                    `;

                }
            )
            .join("");

}


// --------------------------------------------------
// GENERAL MEDIA
// --------------------------------------------------

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
            .from(
                "case_media"
            )
            .select(`
                id,
                title,
                description,
                media_url,
                media_type,
                source_id,
                sources (
                    id,
                    title
                )
            `)
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

        console.error(
            "Error loading media:",
            error
        );


        showEmpty(
            "case-media",
            "Unable to load media."
        );

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        showEmpty(
            "case-media",
            "No media has been added to this case."
        );

        return;

    }


    container.innerHTML =
        data
            .map(
                media => {

                    const source =
                        media.sources;


                    return `

                        <article class="media-card">

                            <h3>
                                ${escapeHTML(
                                    media.title ||
                                    "Untitled Media"
                                )}
                            </h3>


                            ${
                                media.media_type
                                    ? `
                                        <span class="media-type">
                                            ${escapeHTML(
                                                media.media_type
                                            )}
                                        </span>
                                    `
                                    : ""
                            }


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
                                source
                                    ? `
                                        <p class="media-source">

                                            <strong>
                                                Source:
                                            </strong>

                                            ${
                                                source.title
                                                    ? escapeHTML(
                                                        source.title
                                                    )
                                                    : "Source"
                                            }

                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                media.media_url
                                    ? `
                                        <a
                                            class="media-link"
                                            href="${escapeHTML(
                                                media.media_url
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Open Media
                                        </a>
                                    `
                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .join("");

}


// --------------------------------------------------
// CASE DOCUMENTS / COURT RECORDS
// --------------------------------------------------

async function loadDocuments() {

    const container =
        document.getElementById(
            "case-documents"
        );

    if (!container) return;


    // ------------------------------------------
    // GET DOCUMENTS CONNECTED TO THIS CASE
    // ------------------------------------------

    const {
        data: connections,
        error: connectionError
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


    if (connectionError) {

        console.error(
            "Error loading document connections:",
            connectionError
        );


        showEmpty(
            "case-documents",
            "Unable to load court records and documents."
        );

        return;

    }


    if (
        !connections ||
        connections.length === 0
    ) {

        showEmpty(
            "case-documents",
            "No court records or documents have been added."
        );

        return;

    }


    // ------------------------------------------
    // GET DOCUMENT IDS
    // ------------------------------------------

    const documentIds =
        connections
            .map(
                connection =>
                    connection.document_id
            )
            .filter(Boolean);


    if (documentIds.length === 0) {

        showEmpty(
            "case-documents",
            "No court records or documents have been added."
        );

        return;

    }


    // ------------------------------------------
    // LOAD DOCUMENT INFORMATION
    // ------------------------------------------

    const {
        data: documents,
        error: documentError
    } =
        await supabaseClient
            .from("documents")
            .select(`
                id,
                title,
                description,
                document_url,
                document_type,
                publication_date,
                source_id,
                sources (
                    id,
                    title
                )
            `)
            .in(
                "id",
                documentIds
            );


    if (documentError) {

        console.error(
            "Error loading documents:",
            documentError
        );


        showEmpty(
            "case-documents",
            "Unable to load court records and documents."
        );

        return;

    }


    if (
        !documents ||
        documents.length === 0
    ) {

        showEmpty(
            "case-documents",
            "No court records or documents have been added."
        );

        return;

    }


    // ------------------------------------------
    // SORT BY PUBLICATION DATE
    // ------------------------------------------

    const sortedDocuments =
        [...documents].sort(
            (a, b) => {

                if (
                    !a.publication_date &&
                    !b.publication_date
                ) {

                    return 0;

                }


                if (!a.publication_date) {

                    return 1;

                }


                if (!b.publication_date) {

                    return -1;

                }


                return new Date(
                    b.publication_date
                ) -
                new Date(
                    a.publication_date
                );

            }
        );


    // ------------------------------------------
    // DISPLAY DOCUMENTS
    // ------------------------------------------

    container.innerHTML =
        sortedDocuments
            .map(
                documentItem => {

                    const source =
                        documentItem.sources;


                    return `

                        <article class="document-card">

                            <h3>
                                ${escapeHTML(
                                    documentItem.title ||
                                    "Untitled Document"
                                )}
                            </h3>


                            ${
                                documentItem.document_type
                                    ? `
                                        <span class="document-type">
                                            ${escapeHTML(
                                                documentItem.document_type
                                            )}
                                        </span>
                                    `
                                    : ""
                            }


                            ${
                                documentItem.publication_date
                                    ? `
                                        <p>

                                            <strong>
                                                Date:
                                            </strong>

                                            ${escapeHTML(
                                                formatDate(
                                                    documentItem.publication_date
                                                )
                                            )}

                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                documentItem.description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                documentItem.description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                source
                                    ? `
                                        <p class="document-source">

                                            <strong>
                                                Source:
                                            </strong>

                                            ${
                                                source.title
                                                    ? escapeHTML(
                                                        source.title
                                                    )
                                                    : "Source"
                                            }

                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                documentItem.document_url
                                    ? `
                                        <a
                                            href="${escapeHTML(
                                                documentItem.document_url
                                            )}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            class="document-link"
                                        >
                                            View Document
                                        </a>
                                    `
                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .join("");

}


// --------------------------------------------------
// SOURCES & REFERENCES
// --------------------------------------------------

async function loadSources() {

    const container =
        document.getElementById(
            "case-sources"
        );

    if (!container) return;


    // ------------------------------------------
    // GET SOURCES CONNECTED TO THIS CASE
    // ------------------------------------------

    const {
        data: connections,
        error: connectionError
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


    if (connectionError) {

        console.error(
            "Error loading case source connections:",
            connectionError
        );


        showEmpty(
            "case-sources",
            "Unable to load sources."
        );

        return;

    }


    if (
        !connections ||
        connections.length === 0
    ) {

        showEmpty(
            "case-sources",
            "No sources have been added."
        );

        return;

    }


    // ------------------------------------------
    // GET SOURCE IDS
    // ------------------------------------------

    const sourceIds =
        connections
            .map(
                connection =>
                    connection.source_id
            )
            .filter(Boolean);


    if (sourceIds.length === 0) {

        showEmpty(
            "case-sources",
            "No sources have been added."
        );

        return;

    }


    // ------------------------------------------
    // LOAD SOURCES
    // ------------------------------------------

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
            "Error loading sources:",
            sourceError
        );


        showEmpty(
            "case-sources",
            "Unable to load sources."
        );

        return;

    }


    if (
        !sources ||
        sources.length === 0
    ) {

        showEmpty(
            "case-sources",
            "No sources have been added."
        );

        return;

    }


    // ------------------------------------------
    // SORT SOURCES
    // ------------------------------------------

    const sortedSources =
        [...sources].sort(
            (a, b) => {

                if (
                    !a.publication_date &&
                    !b.publication_date
                ) {

                    return 0;

                }


                if (!a.publication_date) {

                    return 1;

                }


                if (!b.publication_date) {

                    return -1;

                }


                return new Date(
                    b.publication_date
                ) -
                new Date(
                    a.publication_date
                );

            }
        );


    // ------------------------------------------
    // DISPLAY SOURCES
    // ------------------------------------------

    container.innerHTML =
        sortedSources
            .map(
                source => {

                    return `

                        <article class="source-card">

                            <h3>

                                ${
                                    source.url
                                        ? createExternalLink(
                                            source.url,
                                            source.title ||
                                            "View Source"
                                        )
                                        : escapeHTML(
                                            source.title ||
                                            "Untitled Source"
                                        )
                                }

                            </h3>


                            ${
                                source.source_type
                                    ? `
                                        <p>

                                            <strong>
                                                Type:
                                            </strong>

                                            ${escapeHTML(
                                                source.source_type
                                            )}

                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                source.publication_date
                                    ? `
                                        <p>

                                            <strong>
                                                Publication Date:
                                            </strong>

                                            ${escapeHTML(
                                                formatDate(
                                                    source.publication_date
                                                )
                                            )}

                                        </p>
                                    `
                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .join("");

}


// --------------------------------------------------
// EXTERNAL LINKS
// --------------------------------------------------

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
            .from(
                "case_links"
            )
            .select(`
                id,
                title,
                url,
                link_type,
                description
            `)
            .eq(
                "case_id",
                caseId
            );


    if (error) {

        console.error(
            "Error loading external links:",
            error
        );


        showEmpty(
            "case-links",
            "Unable to load external links."
        );

        return;

    }


    if (
        !data ||
        data.length === 0
    ) {

        showEmpty(
            "case-links",
            "No external links have been added."
        );

        return;

    }


    container.innerHTML =
        data
            .map(
                link => {

                    return `

                        <article class="external-link-card">

                            <h3>

                                ${createExternalLink(
                                    link.url,
                                    link.title ||
                                    "External Link"
                                )}

                            </h3>


                            ${
                                link.link_type
                                    ? `
                                        <span class="link-type">
                                            ${escapeHTML(
                                                link.link_type
                                            )}
                                        </span>
                                    `
                                    : ""
                            }


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

                        </article>

                    `;

                }
            )
            .join("");

}


// --------------------------------------------------
// RELATED CASES
// --------------------------------------------------

async function loadRelatedCases() {

    const container =
        document.getElementById(
            "case-related"
        );

    if (!container) return;


    /*
        We intentionally load the related cases
        separately instead of using a Supabase
        relationship query.

        This avoids problems with foreign-key
        relationship names.
    */


    const {
        data: connections,
        error: connectionError
    } =
        await supabaseClient
            .from(
                "related_cases"
            )
            .select(`
                id,
                relationship_type,
                related_case_id
            `)
            .eq(
                "case_id",
                caseId
            );


    if (connectionError) {

        console.error(
            "Error loading related cases:",
            connectionError
        );


        showEmpty(
            "case-related",
            "Unable to load related cases."
        );

        return;

    }


    if (
        !connections ||
        connections.length === 0
    ) {

        showEmpty(
            "case-related",
            "No related cases have been added."
        );

        return;

    }


    // ------------------------------------------
    // GET RELATED CASE IDS
    // ------------------------------------------

    const relatedCaseIds =
        connections.map(
            connection =>
                connection.related_case_id
        );


    // ------------------------------------------
    // LOAD CASE INFORMATION
    // ------------------------------------------

    const {
        data: relatedCases,
        error: caseError
    } =
        await supabaseClient
            .from("cases")
            .select(`
                id,
                case_name,
                case_date,
                city,
                state_province,
                country
            `)
            .in(
                "id",
                relatedCaseIds
            );


    if (caseError) {

        console.error(
            "Error loading related case information:",
            caseError
        );


        showEmpty(
            "case-related",
            "Unable to load related case information."
        );

        return;

    }


    // ------------------------------------------
    // CREATE LOOKUP
    // ------------------------------------------

    const caseMap = {};


    (relatedCases || [])
        .forEach(
            relatedCase => {

                caseMap[
                    String(
                        relatedCase.id
                    )
                ] =
                    relatedCase;

            }
        );


    // ------------------------------------------
    // DISPLAY
    // ------------------------------------------

    const cards =
        connections
            .map(
                connection => {

                    const relatedCase =
                        caseMap[
                            String(
                                connection.related_case_id
                            )
                        ];


                    if (!relatedCase) {

                        return "";

                    }


                    const locationParts = [

                        relatedCase.city,
                        relatedCase.state_province,
                        relatedCase.country

                    ].filter(Boolean);


                    return `

                        <article class="related-case-card">

                            <a
                                href="case.html?id=${encodeURIComponent(
                                    relatedCase.id
                                )}"
                            >

                                <h3>
                                    ${escapeHTML(
                                        relatedCase.case_name ||
                                        "Unnamed Case"
                                    )}
                                </h3>

                            </a>


                            ${
                                connection.relationship_type
                                    ? `
                                        <p>

                                            <strong>
                                                Relationship:
                                            </strong>

                                            ${escapeHTML(
                                                connection.relationship_type
                                            )}

                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                relatedCase.case_date
                                    ? `
                                        <p>

                                            <strong>
                                                Date:
                                            </strong>

                                            ${escapeHTML(
                                                formatDate(
                                                    relatedCase.case_date
                                                )
                                            )}

                                        </p>
                                    `
                                    : ""
                            }


                            ${
                                locationParts.length
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                locationParts.join(", ")
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </article>

                    `;

                }
            )
            .filter(Boolean)
            .join("");


    if (!cards) {

        showEmpty(
            "case-related",
            "No related cases have been added."
        );

        return;

    }


    container.innerHTML =
        cards;

}


// --------------------------------------------------
// START
// --------------------------------------------------

loadCase();