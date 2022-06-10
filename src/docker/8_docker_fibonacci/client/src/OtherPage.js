import React from 'react';
import { Link } from 'react-router-dom';

export default () => {
    return (
        <div>
            This is another page.
            <Link to="/">Back to home page</Link>
        </div>
    );
};