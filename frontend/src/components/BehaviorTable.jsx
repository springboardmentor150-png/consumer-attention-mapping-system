import React, { useEffect, useState } from "react";
import { getShopperBehavior } from "../services/api";
import "../styles/behavior.css";


function BehaviorTable() {

    const [behavior, setBehavior] = useState([]);

    useEffect(() => {

        loadBehavior();

    }, []);

    const loadBehavior = async () => {

        const data = await getShopperBehavior();

        setBehavior(data);

    };

    return (

        <div>

            <h2>Shopper Behavior</h2>

            <table>

                <thead>

                    <tr>

                        <th>Track ID</th>

                        <th>Segment</th>

                        <th>Dwell</th>

                        <th>Path</th>

                        <th>Shelves</th>

                    </tr>

                </thead>

                <tbody>

                    {behavior.map((item) => (

                        <tr key={item.id}>

                            <td>{item.track_id}</td>

                            <td>{item.behavior_segment}</td>

                            <td>{item.dwell_time}</td>

                            <td>{item.path_length}</td>

                            <td>{item.shelves_visited}</td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}

export default BehaviorTable;