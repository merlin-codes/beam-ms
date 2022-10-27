import { Component, createSignal } from 'solid-js';

const EditClass: Component = () => {
    return (
        <div>
            
        </div>
    );
}
const EditHours: Component = () => {
    return (
        <div>
            
        </div>
    );
}
const EditUsers: Component = () => {
    return (
        <div>
            <h1>Users</h1>
            <div>
                <input 
            </div>
        </div>
    );
}

const App: Component = () => {
    // 0 => Users
    // 1 => Hours
    // 2 => Classes
    const [mode, setMode] = createSignal(0);
    return (
        <div>
            <div>
                {/* show manipulation of selected mode */}
                {mode() == 0 ? <EditUsers /> : mode() == 1 ? <EditHours /> : <EditClass /> }
            </div>
            <div>
                <button onClick={_ => setMode(0)}>Users</button>
                <button onClick={_ => setMode(1)}>Hours</button>
                <button onClick={_ => setMode(2)}>Class</button>
                {/* changing modes buttons */}
            </div>
            <div>
                {/* selecting specific item from items list */}
            </div>
        </div>
    );
};

export default App;
