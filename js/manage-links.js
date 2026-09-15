/* =========================================
   CBRA — EXTERNAL LINKS MANAGEMENT
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const linksSupabase = window.supabaseClient;


/* -----------------------------------------
   GET CURRENT CASE
   ----------------------------------------- */

function getLinksCurrentCaseId() {

    const selector = document.getElementById("case-selector");

    if (!selector) {
        return null;
    }

    const value = selector.value;

    if (!value) {
        return null;
    }

    return Number(value);
}


/* -----------------------------------------
   LOAD LINKS
   ----------------------------------------- */

async function loadLinks(caseId) {

    const list = document.getElementById("link-list");

    if (!list) {
        console.warn("External links list #link-list was not found.");
        return;
    }

    if (!caseId) {

        list.innerHTML = `
            <p class="empty-message">
                Select a case to view external links.
            </p>
        `;

        return;
    }

    list.innerHTML = `
        <p class="empty-message">
            Loading external links...
        </p>
    `;


    try {

        const { data, error } = await linksSupabase
            .from("case_links")
            .select("*")
            .eq("case_id", Number(caseId))
            .order("title", {
                ascending: true
            });


        if (error) {

            console.error("Error loading external links:", error);

            list.innerHTML = `
                <p class="form-message">
                    Unable to load external links.
                </p>
            `;

            return;
        }


        if (!data || data.length === 0) {

            list.innerHTML = `
                <p class="empty-message">
                    No external links have been added to this case yet.
                </p>
            `;

            return;
        }


        list.innerHTML = data.map(link => {

            const title =
                escapeLinkHTML(
                    link.title || "Untitled Link"
                );

            const linkType =
                link.link_type
                    ? escapeLinkHTML(link.link_type)
                    : "";

            const description =
                link.description
                    ? escapeLinkHTML(link.description)
                    : "";

            const url =
                link.url
                    ? escapeLinkAttribute(link.url)
                    : "";


            return `
                <div class="manage-record">

                    <div>

                        <strong>
                            ${title}
                        </strong>

                        ${
                            linkType
                                ? `
                                    <div>
                                        ${linkType}
                                    </div>
                                `
                                : ""
                        }


                        ${
                            description
                                ? `
                                    <p>
                                        ${description}
                                    </p>
                                `
                                : ""
                        }


                        ${
                            url
                                ? `
                                    <a
                                        href="${url}"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        Open Link
                                    </a>
                                `
                                : ""
                        }

                    </div>


                    <button
                        type="button"
                        class="secondary-button"
                        onclick="removeLink(${Number(link.id)})"
                    >
                        Remove
                    </button>

                </div>
            `;

        }).join("");

    } catch (error) {

        console.error(
            "Unexpected error loading external links:",
            error
        );

        list.innerHTML = `
            <p class="form-message">
                Unable to load external links.
            </p>
        `;
    }
}


/* -----------------------------------------
   ADD LINK
   ----------------------------------------- */

async function addLink(event) {

    if (event) {
        event.preventDefault();
    }


    const caseId = getLinksCurrentCaseId();


    if (!caseId) {

        alert("Please select a case first.");

        return;
    }


    const titleElement =
        document.getElementById("link-title");

    const urlElement =
        document.getElementById("link-url");

    const typeElement =
        document.getElementById("link-type");

    const descriptionElement =
        document.getElementById("link-description");


    if (
        !titleElement ||
        !urlElement ||
        !typeElement ||
        !descriptionElement
    ) {

        console.error(
            "External link form elements could not be found."
        );

        return;
    }


    const title =
        titleElement.value.trim();

    const url =
        urlElement.value.trim();

    const linkType =
        typeElement.value.trim();

    const description =
        descriptionElement.value.trim();


    if (!title) {

        alert("Please enter a link title.");

        return;
    }


    if (!url) {

        alert("Please enter the URL.");

        return;
    }


    try {

        new URL(url);

    } catch {

        alert("Please enter a valid URL.");

        return;
    }


    const button =
        document.querySelector(
            '#link-form button[type="submit"]'
        );


    if (button) {

        button.disabled = true;
        button.textContent = "Adding...";

    }


    try {

        const { error } = await linksSupabase
            .from("case_links")
            .insert({

                case_id: Number(caseId),

                title: title,

                url: url,

                link_type:
                    linkType || null,

                description:
                    description || null

            });


        if (error) {

            console.error(
                "Error adding external link:",
                error
            );

            alert(
                "Unable to add the external link."
            );

            return;
        }


        const form =
            document.getElementById("link-form");


        if (form) {
            form.reset();
        }


        const message =
            document.getElementById("link-message");


        if (message) {

            message.textContent =
                "External link added successfully.";

        }


        await loadLinks(caseId);


    } finally {

        if (button) {

            button.disabled = false;
            button.textContent = "Add Link";

        }

    }
}


/* -----------------------------------------
   REMOVE LINK
   ----------------------------------------- */

async function removeLink(linkId) {

    if (!linkId) {
        return;
    }


    if (!confirm("Remove this external link?")) {
        return;
    }


    const caseId =
        getLinksCurrentCaseId();


    try {

        const { error } =
            await linksSupabase

                .from("case_links")

                .delete()

                .eq(
                    "id",
                    Number(linkId)
                );


        if (error) {

            console.error(
                "Error removing external link:",
                error
            );

            alert(
                "Unable to remove the external link."
            );

            return;
        }


        await loadLinks(caseId);


    } catch (error) {

        console.error(
            "Unexpected error removing external link:",
            error
        );

        alert(
            "Unable to remove the external link."
        );
    }
}


/* -----------------------------------------
   ESCAPE HTML
   ----------------------------------------- */

function escapeLinkHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        String(value ?? "");

    return div.innerHTML;
}


/* -----------------------------------------
   ESCAPE URL ATTRIBUTE
   ----------------------------------------- */

function escapeLinkAttribute(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


/* -----------------------------------------
   INITIALIZE
   ----------------------------------------- */

function initializeLinksManagement() {

    const form =
        document.getElementById("link-form");

    const selector =
        document.getElementById("case-selector");


    /* -------------------------------------
       FORM SUBMIT
       ------------------------------------- */

    if (form) {

        form.addEventListener(
            "submit",
            addLink
        );

    }


    /* -------------------------------------
       CASE CHANGED
       ------------------------------------- */

    if (selector) {

        selector.addEventListener(
            "change",
            function () {

                loadLinks(
                    this.value
                );

            }
        );


        /* ---------------------------------
           LOAD CURRENT CASE
           --------------------------------- */

        if (selector.value) {

            loadLinks(
                selector.value
            );

        }

    }

}


/* -----------------------------------------
   DOM READY
   ----------------------------------------- */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeLinksManagement
    );

} else {

    initializeLinksManagement();

}


/* -----------------------------------------
   GLOBAL EXPORTS
   ----------------------------------------- */

window.loadLinks =
    loadLinks;

window.addLink =
    addLink;

window.removeLink =
    removeLink;