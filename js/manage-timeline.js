async function loadTimeline(caseId) {

    const list =
        document.getElementById("manage-timeline-list");

    if (!caseId) {
        list.innerHTML = "<p>Select a case to view timeline events.</p>";
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("timeline_events")
            .select(`
                id,
                event_date,
                title,
                description,
                source_id,
                sources (
                    title
                )
            `)
            .eq("case_id", caseId)
            .order("event_date");

    if (error) {
        console.error(error);
        return;
    }

    list.innerHTML = "";

    if (!data || data.length === 0) {
        list.innerHTML = "<p>No timeline events yet.</p>";
        return;
    }

    data.forEach(event => {

        const card =
            document.createElement("div");

        card.className = "manage-record";

        const title =
            document.createElement("strong");

        title.textContent =
            event.title;

        card.appendChild(title);

        const details =
            document.createElement("p");

        details.textContent =
            `${event.event_date || "Date unavailable"} — ${event.description}`;

        card.appendChild(details);

        if (event.sources) {

            const source =
                document.createElement("p");

            source.textContent =
                `Source: ${event.sources.title}`;

            card.appendChild(source);
        }

        const remove =
            document.createElement("button");

        remove.textContent = "Remove";

        remove.onclick = () =>
            removeTimeline(event.id);

        card.appendChild(remove);

        list.appendChild(card);
    });
}


async function addTimeline() {

    const caseId =
        caseSelector.value;

    if (!caseId) {
        alert("Please select a case first.");
        return;
    }

    const title =
        document.getElementById(
            "timeline-title"
        ).value.trim();

    const description =
        document.getElementById(
            "timeline-description"
        ).value.trim();

    if (!title || !description) {
        alert("Please enter a title and description.");
        return;
    }

    const sourceId =
        document.getElementById(
            "timeline-source"
        ).value;

    const { error } =
        await supabaseClient
            .from("timeline_events")
            .insert({
                case_id: caseId,
                event_date:
                    document.getElementById(
                        "timeline-date"
                    ).value || null,
                title,
                description,
                source_id:
                    sourceId ? Number(sourceId) : null
            });

    if (error) {
        console.error(error);
        alert("Unable to add timeline event.");
        return;
    }

    document.getElementById("timeline-date").value = "";
    document.getElementById("timeline-title").value = "";
    document.getElementById("timeline-description").value = "";
    document.getElementById("timeline-source").value = "";

    loadTimeline(caseId);
}


async function removeTimeline(id) {

    if (!confirm("Remove this timeline event?"))
        return;

    const { error } =
        await supabaseClient
            .from("timeline_events")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    loadTimeline(caseSelector.value);
}


async function loadTimelineSources(caseId) {

    const selector =
        document.getElementById("timeline-source");

    selector.innerHTML =
        '<option value="">Select source</option>';

    if (!caseId) {
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("sources")
            .select("id, title")
            .eq("case_id", caseId)
            .order("title");

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(source => {

        const option =
            document.createElement("option");

        option.value = source.id;
        option.textContent = source.title;

        selector.appendChild(option);
    });
}


/* ----------------------------------
   Add timeline button
   ---------------------------------- */

document.getElementById(
    "add-timeline"
).addEventListener(
    "click",
    addTimeline
);


/* ----------------------------------
   Case selector change
   ---------------------------------- */

caseSelector.addEventListener("change", () => {

    const caseId =
        caseSelector.value;

    loadTimeline(caseId);
    loadTimelineSources(caseId);
});