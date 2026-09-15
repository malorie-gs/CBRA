/* =========================================
   CBRA — CASE RESEARCH TAG MANAGEMENT
   ========================================= */


/* -----------------------------------------
   SUPABASE
   ----------------------------------------- */

const tagsSupabaseClient =
    window.supabaseClient;


/* -----------------------------------------
   CURRENT CASE
   ----------------------------------------- */

let tagsCurrentCaseId = null;


/* -----------------------------------------
   TAG CATEGORIES
   ----------------------------------------- */

const TAG_CATEGORIES = [
    "crime",
    "influence",
    "mental_health",
    "demographic"
];


/* -----------------------------------------
   CATEGORY INFORMATION
   ----------------------------------------- */

const TAG_CATEGORY_INFO = {

    crime: {
        selectorId: "crime-tag-selector",
        listId: "crime-tag-list",
        formId: "crime-tag-form",
        messageId: "crime-tag-message",
        emptyMessage: "No crime tags have been added."
    },

    influence: {
        selectorId: "influence-tag-selector",
        listId: "influence-tag-list",
        formId: "influence-tag-form",
        messageId: "influence-tag-message",
        emptyMessage: "No influence tags have been added."
    },

    mental_health: {
        selectorId: "mental-health-tag-selector",
        listId: "mental-health-tag-list",
        formId: "mental-health-tag-form",
        messageId: "mental-health-tag-message",
        emptyMessage: "No mental-health tags have been added."
    },

    demographic: {
        selectorId: "demographic-tag-selector",
        listId: "demographic-tag-list",
        formId: "demographic-tag-form",
        messageId: "demographic-tag-message",
        emptyMessage: "No demographic tags have been added."
    }

};


/* -----------------------------------------
   HTML ESCAPING
   ----------------------------------------- */

function escapeTagHTML(value) {

    if (value === null || value === undefined) {
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
   SET CURRENT CASE
   ----------------------------------------- */

function setTagsCurrentCase(caseId) {

    tagsCurrentCaseId =
        caseId
            ? Number(caseId)
            : null;

    if (!tagsCurrentCaseId) {

        clearAllTagSections();

        return;

    }

    loadTags(tagsCurrentCaseId);

}


/* -----------------------------------------
   CLEAR ALL TAG SECTIONS
   ----------------------------------------- */

function clearAllTagSections() {

    TAG_CATEGORIES.forEach(function (category) {

        const info =
            TAG_CATEGORY_INFO[category];

        const list =
            document.getElementById(
                info.listId
            );

        const selector =
            document.getElementById(
                info.selectorId
            );

        const message =
            document.getElementById(
                info.messageId
            );

        if (list) {

            list.innerHTML = `
                <p class="empty-message">
                    Select a case to view ${getCategoryDisplayName(category).toLowerCase()} tags.
                </p>
            `;

        }

        if (selector) {

            selector.innerHTML = `
                <option value="">
                    -- Select ${getCategoryDisplayName(category)} Tag --
                </option>
            `;

        }

        if (message) {

            message.textContent = "";

        }

    });

}


/* -----------------------------------------
   CATEGORY DISPLAY NAME
   ----------------------------------------- */

function getCategoryDisplayName(category) {

    switch (category) {

        case "crime":
            return "Crime";

        case "influence":
            return "Influence";

        case "mental_health":
            return "Mental Health";

        case "demographic":
            return "Demographic";

        default:
            return "Research";

    }

}


/* -----------------------------------------
   LOAD TAGS FOR CASE
   ----------------------------------------- */

async function loadTags(caseId) {

    if (!caseId) {

        clearAllTagSections();

        return;

    }

    tagsCurrentCaseId =
        Number(caseId);


    TAG_CATEGORIES.forEach(function (category) {

        const info =
            TAG_CATEGORY_INFO[category];

        const list =
            document.getElementById(
                info.listId
            );

        if (list) {

            list.innerHTML = `
                <p class="empty-message">
                    Loading ${getCategoryDisplayName(category).toLowerCase()} tags...
                </p>
            `;

        }

    });


    try {

        const {
            data,
            error
        } =
            await tagsSupabaseClient
                .from("case_tags")
                .select(`
                    tag_id,
                    tag:tags (
                        id,
                        name,
                        category
                    )
                `)
                .eq(
                    "case_id",
                    Number(caseId)
                );


        if (error) {

            throw error;

        }


        const caseTags =
            data || [];


        TAG_CATEGORIES.forEach(function (category) {

            const categoryTags =
                caseTags
                    .map(function (item) {

                        return item.tag;

                    })
                    .filter(function (tag) {

                        return (
                            tag &&
                            tag.category === category
                        );

                    })
                    .sort(function (a, b) {

                        return String(
                            a.name || ""
                        ).localeCompare(
                            String(
                                b.name || ""
                            )
                        );

                    });


            renderTagList(
                category,
                categoryTags
            );


            loadAvailableTags(
                category,
                categoryTags
            );

        });

    } catch (error) {

        console.error(
            "Error loading case research tags:",
            error
        );


        TAG_CATEGORIES.forEach(function (category) {

            const info =
                TAG_CATEGORY_INFO[category];

            const list =
                document.getElementById(
                    info.listId
                );

            if (list) {

                list.innerHTML = `
                    <p class="form-message">
                        Unable to load ${getCategoryDisplayName(category).toLowerCase()} tags.
                    </p>
                `;

            }

        });

    }

}


/* -----------------------------------------
   RENDER TAG LIST
   ----------------------------------------- */

function renderTagList(
    category,
    tags
) {

    const info =
        TAG_CATEGORY_INFO[category];

    const list =
        document.getElementById(
            info.listId
        );


    if (!list) {

        return;

    }


    if (!tags || tags.length === 0) {

        list.innerHTML = `
            <p class="empty-message">
                ${info.emptyMessage}
            </p>
        `;

        return;

    }


    list.innerHTML = "";


    tags.forEach(function (tag) {

        const wrapper =
            document.createElement("div");

        wrapper.className =
            "case-tag";


        wrapper.innerHTML = `

            <span>
                ${escapeTagHTML(tag.name)}
            </span>

            <button
                type="button"
                class="remove-tag-button"
                data-tag-id="${tag.id}"
            >
                Remove
            </button>

        `;


        const removeButton =
            wrapper.querySelector(
                ".remove-tag-button"
            );


        if (removeButton) {

            removeButton.addEventListener(
                "click",
                function () {

                    removeTag(
                        tag.id,
                        category
                    );

                }
            );

        }


        list.appendChild(
            wrapper
        );

    });

}


/* -----------------------------------------
   LOAD AVAILABLE TAGS
   ----------------------------------------- */

async function loadAvailableTags(
    category,
    existingCaseTags
) {

    const info =
        TAG_CATEGORY_INFO[category];

    const selector =
        document.getElementById(
            info.selectorId
        );


    if (!selector) {

        return;

    }


    selector.innerHTML = `

        <option value="">
            -- Select ${getCategoryDisplayName(category)} Tag --
        </option>

    `;


    try {

        const {
            data,
            error
        } =
            await tagsSupabaseClient
                .from("tags")
                .select(`
                    id,
                    name,
                    category
                `)
                .eq(
                    "category",
                    category
                )
                .order(
                    "name",
                    {
                        ascending: true
                    }
                );


        if (error) {

            throw error;

        }


        const existingTagIds =
            new Set(
                (existingCaseTags || [])
                    .map(function (tag) {

                        return Number(
                            tag.id
                        );

                    })
            );


        const availableTags =
            (data || [])
                .filter(function (tag) {

                    return !existingTagIds.has(
                        Number(tag.id)
                    );

                });


        availableTags.forEach(function (tag) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                String(tag.id);

            option.textContent =
                tag.name;

            selector.appendChild(
                option
            );

        });

    } catch (error) {

        console.error(
            `Error loading ${category} tags:`,
            error
        );

    }

}


/* -----------------------------------------
   ADD TAG
   ----------------------------------------- */

async function addTag(
    event,
    category
) {

    event.preventDefault();


    const info =
        TAG_CATEGORY_INFO[category];


    const selector =
        document.getElementById(
            info.selectorId
        );

    const message =
        document.getElementById(
            info.messageId
        );


    if (!tagsCurrentCaseId) {

        if (message) {

            message.textContent =
                "Please select a case first.";

        }

        return;

    }


    if (!selector) {

        return;

    }


    const tagId =
        selector.value;


    if (!tagId) {

        if (message) {

            message.textContent =
                `Please select a ${getCategoryDisplayName(category).toLowerCase()} tag.`;

        }

        return;

    }


    if (message) {

        message.textContent =
            "Adding tag...";

    }


    try {

        /*
         * Verify that the selected tag
         * actually belongs to this category.
         */

        const {
            data: tag,
            error: tagError
        } =
            await tagsSupabaseClient
                .from("tags")
                .select(`
                    id,
                    name,
                    category
                `)
                .eq(
                    "id",
                    Number(tagId)
                )
                .maybeSingle();


        if (tagError) {

            throw tagError;

        }


        if (!tag) {

            throw new Error(
                "Selected tag could not be found."
            );

        }


        if (tag.category !== category) {

            throw new Error(
                "Selected tag does not belong to this category."
            );

        }


        /*
         * Prevent duplicates.
         */

        const {
            data: existing,
            error: existingError
        } =
            await tagsSupabaseClient
                .from("case_tags")
                .select("tag_id")
                .eq(
                    "case_id",
                    Number(tagsCurrentCaseId)
                )
                .eq(
                    "tag_id",
                    Number(tagId)
                )
                .maybeSingle();


        if (existingError) {

            throw existingError;

        }


        if (existing) {

            if (message) {

                message.textContent =
                    "This tag is already assigned to this case.";

            }

            return;

        }


        /*
         * Add tag to case.
         */

        const {
            error: insertError
        } =
            await tagsSupabaseClient
                .from("case_tags")
                .insert({
                    case_id:
                        Number(tagsCurrentCaseId),

                    tag_id:
                        Number(tagId)
                });


        if (insertError) {

            throw insertError;

        }


        if (message) {

            message.textContent =
                `${tag.name} added successfully.`;

        }


        selector.value = "";


        await loadTags(
            tagsCurrentCaseId
        );


    } catch (error) {

        console.error(
            `Error adding ${category} tag:`,
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Unable to add tag.";

        }

    }

}


/* -----------------------------------------
   REMOVE TAG
   ----------------------------------------- */

async function removeTag(
    tagId,
    category
) {

    if (!tagsCurrentCaseId) {

        return;

    }


    const info =
        TAG_CATEGORY_INFO[category];

    const message =
        document.getElementById(
            info.messageId
        );


    if (!confirm(
        "Remove this tag from the case?"
    )) {

        return;

    }


    try {

        const {
            error
        } =
            await tagsSupabaseClient
                .from("case_tags")
                .delete()
                .eq(
                    "case_id",
                    Number(tagsCurrentCaseId)
                )
                .eq(
                    "tag_id",
                    Number(tagId)
                );


        if (error) {

            throw error;

        }


        if (message) {

            message.textContent =
                "Tag removed successfully.";

        }


        await loadTags(
            tagsCurrentCaseId
        );


    } catch (error) {

        console.error(
            `Error removing ${category} tag:`,
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Unable to remove tag.";

        }

    }

}


/* -----------------------------------------
   CREATE NEW TAG
   ----------------------------------------- */

async function createTag(
    event
) {

    event.preventDefault();


    const nameInput =
        document.getElementById(
            "new-tag-name"
        );

    const categoryInput =
        document.getElementById(
            "new-tag-category"
        );

    const message =
        document.getElementById(
            "new-tag-message"
        );


    if (!nameInput || !categoryInput) {

        return;

    }


    const name =
        nameInput.value.trim();

    const category =
        categoryInput.value;


    if (!name) {

        if (message) {

            message.textContent =
                "Please enter a tag name.";

        }

        return;

    }


    if (!TAG_CATEGORIES.includes(
        category
    )) {

        if (message) {

            message.textContent =
                "Please select a valid tag category.";

        }

        return;

    }


    if (message) {

        message.textContent =
            "Creating tag...";

    }


    try {

        /*
         * Check whether a tag with
         * this name already exists.
         */

        const {
            data: existingTags,
            error: existingError
        } =
            await tagsSupabaseClient
                .from("tags")
                .select(`
                    id,
                    name,
                    category
                `)
                .ilike(
                    "name",
                    name
                );


        if (existingError) {

            throw existingError;

        }


        if (
            existingTags &&
            existingTags.length > 0
        ) {

            if (message) {

                message.textContent =
                    "A tag with this name already exists.";

            }

            return;

        }


        /*
         * Create tag.
         */

        const {
            data,
            error
        } =
            await tagsSupabaseClient
                .from("tags")
                .insert({
                    name: name,
                    category: category
                })
                .select()
                .single();


        if (error) {

            throw error;

        }


        if (message) {

            message.textContent =
                `${data.name} created successfully.`;

        }


        nameInput.value = "";


        /*
         * Refresh the tag selector
         * for the new category.
         */

        await loadAvailableTags(
            category,
            await getExistingTagsForCase(
                tagsCurrentCaseId,
                category
            )
        );


        /*
         * Automatically select the newly
         * created tag when a case is selected.
         */

        if (tagsCurrentCaseId) {

            const selector =
                document.getElementById(
                    TAG_CATEGORY_INFO[
                        category
                    ].selectorId
                );


            if (selector) {

                selector.value =
                    String(data.id);

            }

        }

    } catch (error) {

        console.error(
            "Error creating tag:",
            error
        );


        if (message) {

            message.textContent =
                error.message ||
                "Unable to create tag.";

        }

    }

}


/* -----------------------------------------
   GET EXISTING TAGS FOR CASE
   ----------------------------------------- */

async function getExistingTagsForCase(
    caseId,
    category
) {

    if (!caseId) {

        return [];

    }


    try {

        const {
            data,
            error
        } =
            await tagsSupabaseClient
                .from("case_tags")
                .select(`
                    tag:tags (
                        id,
                        name,
                        category
                    )
                `)
                .eq(
                    "case_id",
                    Number(caseId)
                );


        if (error) {

            throw error;

        }


        return (data || [])
            .map(function (item) {

                return item.tag;

            })
            .filter(function (tag) {

                return (
                    tag &&
                    tag.category === category
                );

            });

    } catch (error) {

        console.error(
            "Error getting existing tags:",
            error
        );

        return [];

    }

}


/* -----------------------------------------
   FORM EVENT LISTENERS
   ----------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * Create New Tag
         */

        const newTagForm =
            document.getElementById(
                "new-tag-form"
            );


        if (newTagForm) {

            newTagForm.addEventListener(
                "submit",
                createTag
            );

        }


        /*
         * Category tag forms
         */

        TAG_CATEGORIES.forEach(
            function (category) {

                const info =
                    TAG_CATEGORY_INFO[
                        category
                    ];


                const form =
                    document.getElementById(
                        info.formId
                    );


                if (form) {

                    form.addEventListener(
                        "submit",
                        function (event) {

                            addTag(
                                event,
                                category
                            );

                        }
                    );

                }

            }
        );


        /*
         * Watch the case selector.
         *
         * This keeps the tag system working
         * even if manage.js changes the
         * selected case after page load.
         */

        const caseSelector =
            document.getElementById(
                "case-selector"
            );


        if (caseSelector) {

            caseSelector.addEventListener(
                "change",
                function () {

                    setTagsCurrentCase(
                        caseSelector.value
                    );

                }
            );


            if (caseSelector.value) {

                setTagsCurrentCase(
                    caseSelector.value
                );

            }

        }

    }
);


/* -----------------------------------------
   PUBLIC FUNCTIONS
   ----------------------------------------- */

window.loadTags =
    loadTags;

window.setTagsCurrentCase =
    setTagsCurrentCase;

window.addTag =
    addTag;

window.removeTag =
    removeTag;

window.createTag =
    createTag;