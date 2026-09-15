async function loadNotes(caseId) {

    const list =
        document.getElementById("manage-notes-list");

    const { data, error } =
        await supabaseClient
            .from("case_notes")
            .select("id, title, content, note_type")
            .eq("case_id", caseId)
            .order("created_at");

    if (error) {
        console.error(error);
        return;
    }

    list.innerHTML = "";

    if (!data || data.length === 0) {
        list.innerHTML = "<p>No research notes added yet.</p>";
        return;
    }

    data.forEach(note => {

        const card =
            document.createElement("div");

        card.className = "manage-record";

        const title =
            document.createElement("strong");

        title.textContent =
            note.title;

        card.appendChild(title);

        if (note.note_type) {

            const type =
                document.createElement("p");

            type.textContent =
                note.note_type;

            card.appendChild(type);
        }

        const content =
            document.createElement("p");

        content.textContent =
            note.content;

        card.appendChild(content);

        const remove =
            document.createElement("button");

        remove.textContent = "Remove";

        remove.onclick = () =>
            removeNote(note.id);

        card.appendChild(remove);

        list.appendChild(card);
    });
}


async function addNote() {

    const caseId =
        caseSelector.value;

    if (!caseId) {
        alert("Please select a case first.");
        return;
    }

    const title =
        document.getElementById("note-title")
            .value.trim();

    const content =
        document.getElementById("note-content")
            .value.trim();

    if (!title || !content) {
        alert("Please enter a title and note.");
        return;
    }

    const { error } =
        await supabaseClient
            .from("case_notes")
            .insert({
                case_id: caseId,
                title,
                content,
                note_type:
                    document.getElementById("note-type")
                        .value.trim() || null
            });

    if (error) {
        console.error(error);
        alert("Unable to add note.");
        return;
    }

    document.getElementById("note-title").value = "";
    document.getElementById("note-type").value = "";
    document.getElementById("note-content").value = "";

    loadNotes(caseId);
}


async function removeNote(id) {

    if (!confirm("Remove this research note?"))
        return;

    const { error } =
        await supabaseClient
            .from("case_notes")
            .delete()
            .eq("id", id);

    if (error) {
        console.error(error);
        return;
    }

    loadNotes(caseSelector.value);
}


document.getElementById(
    "add-note"
).addEventListener(
    "click",
    addNote
);