import { useGETEvents } from "../lib/apiClient"

export function ListEvents() {
    const { data: events, loading, error } = useGETEvents();
    
    if (loading) {
        return (
            <div><h1>Loading, please to waiting...</h1></div>
        )
    }

    if (error) {
        console.log(error);
        return (
            <div>
                <h1>Oopsie woopsie owo we made a fucky wucky!</h1>
                <code>{JSON.stringify(error)}</code>
            </div>
        )
    }

    return (
        <div>
            <h1>All Events</h1>
            {events.map(evt => (
                <div key={evt.id}>
                    <h2>{evt.name}</h2>
                </div>
            ))}
        </div>
    )
}
