
import { useUser } from './usercontext';

export default function Header() {
    const { state } = useUser();

    return (
        <header className="header">
            <div className="header-title">
                <h3>WeCal</h3>
            </div>

            {state.id ? <div className="header-status">Chat ready</div> : null}
        </header>
    );
}
