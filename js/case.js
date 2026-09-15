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
   ADDITIONAL OFFENSES
   ----------------------------------------- */

function renderAdditionalOffenses(value) {

    const container =
        document.getElementById(
            "case-additional-offenses"
        );

    if (!container) return;

    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        container.textContent = "—";

        return;

    }

    const offenses =
        String(value)
            .split(/\s*(?:,|;|\n)\s*/)
            .map(offense => offense.trim())
            .filter(Boolean);

    if (offenses.length === 0) {

        container.textContent = "—";

        return;

    }

    container.innerHTML = `
        <ul class="additional-offenses-list">

            ${offenses
                .map(
                    offense => `
                        <li>
                            ${escapeHTML(offense)}
                        </li>
                    `
                )
                .join("")
            }

        </ul>
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
                description,
                offense,
                additional_offenses,
                classification,
                outcome,
                victim_count,
                fatality_count
            `)
            .eq("id", caseId)
            .single();


    /* -----------------------------------------
       ERROR
       ----------------------------------------- */

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
       CASE HEADER
       ----------------------------------------- */

    setText(
        "case-name",
        caseData.case_name
    );

    setText(
        "case-date",
        formatDate(
            caseData.case_date
        )
    );


    /* -----------------------------------------
       CASE LOCATION
       ----------------------------------------- */

    setText(
        "case-country",
        caseData.country
    );

    setText(
        "case-state-province",
        caseData.state_province
    );

    setText(
        "case-city",
        caseData.city
    );


    /* -----------------------------------------
       CASE DESCRIPTION
       ----------------------------------------- */

    setText(
        "case-description",
        caseData.description
    );


    /* -----------------------------------------
       CLASSIFICATION
       ----------------------------------------- */

    setText(
        "case-classification",
        caseData.classification
    );


    /* -----------------------------------------
       PRIMARY OFFENSE
       ----------------------------------------- */

    setText(
        "case-offense",
        caseData.offense
    );


    /* -----------------------------------------
       ADDITIONAL OFFENSES
       ----------------------------------------- */

    renderAdditionalOffenses(
        caseData.additional_offenses
    );


    /* -----------------------------------------
       OUTCOME
       ----------------------------------------- */

    setText(
        "case-outcome",
        caseData.outcome
    );


    /* -----------------------------------------
       VICTIM COUNT
       ----------------------------------------- */

    setText(
        "case-victim-count",
        caseData.victim_count
    );


    /* -----------------------------------------
       FATALITY COUNT
       ----------------------------------------- */

    setText(
        "case-fatality-count",
        caseData.fatality_count
    );

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
                people (
                    id,
                    name,
                    date_of_birth,
                    age,
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

    container.innerHTML =
        data
            .map(item => {

                const person =
                    item.people;

                if (!person) {

                    return "";

                }

                return `
                    <div class="person-card">

                        <h3>
                            <a
                                href="person.html?id=${encodeURIComponent(person.id)}"
                            >
                                ${escapeHTML(person.name)}
                            </a>
                        </h3>

                        <p>
                            <strong>Role:</strong>
                            ${escapeHTML(item.role || "—")}
                        </p>

                        <p>
                            <strong>Age:</strong>
                            ${escapeHTML(person.age ?? "—")}
                        </p>

                        <p>
                            <strong>Date of Birth:</strong>
                            ${escapeHTML(
                                person.date_of_birth
                                    ? formatDate(person.date_of_birth)
                                    : "—"
                            )}
                        </p>

                        <p>
                            <strong>Gender:</strong>
                            ${escapeHTML(person.gender || "—")}
                        </p>

                    </div>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD TAGS
   ----------------------------------------- */

async function loadTags() {

    const container =
        document.getElementById(
            "case-tags"
        );

    if (!container) return;

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
            "CBRA: Error loading tags:",
            error
        );

        showEmpty(
            "case-tags",
            "Unable to load tags."
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            "case-tags",
            "No tags are linked to this case."
        );

        return;

    }

    const categoryOrder = {

        crime: 1,
        influence: 2,
        mental_health: 3,
        demographic: 4

    };

    data.sort(
        (a, b) => {

            const aCategory =
                a.tags?.category || "";

            const bCategory =
                b.tags?.category || "";

            const aOrder =
                categoryOrder[aCategory] || 99;

            const bOrder =
                categoryOrder[bCategory] || 99;

            if (aOrder !== bOrder) {

                return aOrder - bOrder;

            }

            return (
                a.tags?.name || ""
            ).localeCompare(
                b.tags?.name || ""
            );

        }
    );

    container.innerHTML =
        data
            .map(item => {

                const tag =
                    item.tags;

                if (!tag) {

                    return "";

                }

                return `
                    <a
                        class="case-tag"
                        href="archive.html?tag=${encodeURIComponent(tag.name)}"
                    >
                        ${escapeHTML(tag.name)}
                    </a>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD CRIME SCENE PHOTOS
   ----------------------------------------- */

async function loadCrimeScenePhotos() {

    const container =
        document.getElementById(
            "crime-scene-photos"
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
            "crime-scene-photos",
            "Unable to load crime scene photos."
        );

        return;

    }

    if (!data || data.length === 0) {

        showEmpty(
            "crime-scene-photos",
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
                                src="${escapeHTML(photo.image_url)}"
                                alt="${escapeHTML(photo.title || "Crime scene photo")}"
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
                                ${photo.date_taken
                                    ? escapeHTML(
                                        formatDate(
                                            photo.date_taken
                                        )
                                    )
                                    : "—"
                                }
                            </p>

                            <p>
                                ${escapeHTML(
                                    photo.description ||
                                    ""
                                )}
                            </p>

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
                url,
                sources (
                    id,
                    title,
                    url
                )
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

    container.innerHTML =
        data
            .map(media => {

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

                        <p>
                            ${escapeHTML(
                                media.description ||
                                ""
                            )}
                        </p>

                        ${
                            media.url
                                ? createExternalLink(
                                    media.url,
                                    "Open Media"
                                )
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
        documentCases.map(
            item => item.document_id
        );

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
                url,
                source_id,
                sources (
                    id,
                    title,
                    url
                )
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

    documents.sort(
        (a, b) => {

            if (!a.publication_date) return 1;

            if (!b.publication_date) return -1;

            return (
                new Date(b.publication_date) -
                new Date(a.publication_date)
            );

        }
    );

    container.innerHTML =
        documents
            .map(document => {

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
                            ${document.publication_date
                                ? escapeHTML(
                                    formatDate(
                                        document.publication_date
                                    )
                                )
                                : "—"
                            }
                        </p>

                        <p>
                            ${escapeHTML(
                                document.description ||
                                ""
                            )}
                        </p>

                        ${
                            document.url
                                ? createExternalLink(
                                    document.url,
                                    "View Document"
                                )
                                : ""
                        }

                    </div>
                `;

            })
            .join("");

}


/* -----------------------------------------
   LOAD SOURCES
   ----------------------------------------- */

async function loadSources() {

    const container =
        document.getElementById(
            "case-sources"
        );

    if (!container) return;

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
            "CBRA: Error loading case sources:",
            sourceCaseError
        );

        showEmpty(
            "case-sources",
            "Unable to load sources."
        );

        return;

    }

    if (
        !sourceCases ||
        sourceCases.length === 0
    ) {

        showEmpty(
            "case-sources",
            "No sources are linked to this case."
        );

        return;

    }

    const sourceIds =
        sourceCases.map(
            item => item.source_id
        );

    const {
        data: sources,
        error
    } =
        await supabaseClient
            .from("sources")
            .select(`
                id,
                title,
                publisher,
                publication_date,
                url
            `)
            .in(
                "id",
                sourceIds
            );

    if (error) {

        console.error(
            "CBRA: Error loading sources:",
            error
        );

        showEmpty(
            "case-sources",
            "Unable to load sources."
        );

        return;

    }

    if (!sources || sources.length === 0) {

        showEmpty(
            "case-sources",
            "No sources are available."
        );

        return;

    }

    sources.sort(
        (a, b) => {

            if (!a.publication_date) return 1;

            if (!b.publication_date) return -1;

            return (
                new Date(b.publication_date) -
                new Date(a.publication_date)
            );

        }
    );

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
                            <strong>Publisher:</strong>
                            ${escapeHTML(
                                source.publisher ||
                                "—"
                            )}
                        </p>

                        <p>
                            <strong>Publication Date:</strong>
                            ${source.publication_date
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

                        <p>
                            ${escapeHTML(
                                link.description ||
                                ""
                            )}
                        </p>

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
            "related-cases"
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
            "related-cases",
            "Unable to load related cases."
        );

        return;

    }

    if (
        !relationships ||
        relationships.length === 0
    ) {

        showEmpty(
            "related-cases",
            "No related cases are linked."
        );

        return;

    }

    const relatedCaseIds =
        relationships.map(
            relationship =>
                relationship.related_case_id
        );

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
            "related-cases",
            "Unable to load related cases."
        );

        return;

    }

    if (!cases || cases.length === 0) {

        showEmpty(
            "related-cases",
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
                                    relatedCase.case_name
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
                            ${relatedCase.case_date
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
loadSources();
loadLinks();
loadRelatedCases();