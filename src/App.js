import 'antd/dist/reset.css';
import './App.css';
import { Table, Modal } from 'antd';
import { useState, useEffect, useRef, useMemo } from "react";
import { listen,emit } from '@tauri-apps/api/event'

const App = () => {
	const columns = [
		{
			title: 'ID',
			dataIndex: 'index',
			key: 'index',
		},
		{
			title: '数据',
			dataIndex: 'data',
			key: 'data',
		},
		{
			title: 'time_seq',
			dataIndex: 'time',
			key: 'time',
		},
		{
			title: 'task_id',
			dataIndex: 'task_id',
			key: 'task_id',
		},
	];
	let [dataSource, setDataSource] = useState({
		list: [
			{ index: 0, data: "" },
			{ index: 1, data: "" },
			{ index: 2, data: "" },
			{ index: 3, data: "" },
			{ index: 4, data: "" }
		]
	});
	const [recordMap, setRecordMap] = useState({
		map: {}
	});
	let unlistent = useRef(null);
	// const add_listen = async () => {
	// 	console.log("add_listen");
	// 	const record_map = {};
	// 	unlistent.current = await listen("fetch-data", (event) => {
	// 		const list = dataSource;
	// 		let data = JSON.parse(event.payload);
	// 		list.list[data.index].data = data.data;
	// 		setDataSource({ list: list.list });
	// 		//console.log(new Date().toLocaleTimeString());
	// 		let index = `index_${data.index}`;
	// 		//const current_data = recordMap.data;
	// 		if(record_map[index] === undefined){
	// 			record_map[index] = [];
	// 		}
	// 		record_map[index].push(data);
	// 		//speed_map[index].push(data);
	// 		// if(count <=5){
	// 		// 	console.log("data ==",speed_map);
	// 		// }
	// 		setRecordMap({data:record_map});
	// 	});
	// }
	//console.log("update");
	//add_listen();
	useEffect(() => {
		console.log("use effect");
		const add_listen = async () => {
			const record_map = {};
			console.log("add_listen");
			unlistent.current = await listen("fetch-data", (event) => {
				const list = dataSource;
				let data = JSON.parse(event.payload);
				list.list[data.index].data = data.data;
				list.list[data.index].task_id = data.task_id;
				let time_seq = new Date().toLocaleTimeString();
				list.list[data.index].time =  time_seq;
				setDataSource({ list: list.list });
				console.log(new Date().toLocaleTimeString(), data.task_id);
				let index = `index_${data.index}`;
				//const current_data = recordMap.data;
				if (record_map[index] === undefined) {
					record_map[index] = [];
				}
				data.time = time_seq;
				record_map[index].push(data);
				//speed_map[index].push(data);
				// if(count <=5){
				// 	console.log("data ==",speed_map);
				// }
				setRecordMap({ map: record_map });
				//console.log(recordMap.map);
			});
		}
		add_listen();
		console.log("start");
		emit("start");
		console.log("start----");
		return () => {
			console.log("leave");
			emit("cancel-all");
			unlistent.current !== null && (unlistent.current)();
		}
	}, []);

	// useEffect(()=>{
	// 	console.log("1111",recordMap.map);
	// },[recordMap]);

	// useEffect(()=>{
	// 	console.log(recordMap.data);
	// },[recordMap]);

	const [currentIndex, setcurrentIndex] = useState(0);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const gen_modal_content = () => {
		let index = `index_${currentIndex}`;
		if (currentIndex === null) {
			return null;
		}
		if (recordMap.map[index] === undefined) {
			return null
		}
		const result = recordMap.map[index];
		//console.log(result);
		let dom_arr = [];
		for (let i = result.length - 1; i >= 0; i--) {
			dom_arr.push(<p key={i}>{JSON.stringify(result[i])}</p>)
		}
		return dom_arr;
		// return [];
	}
	return (
		<div className="App">
			<Table dataSource={dataSource.list} columns={columns} pagination={false} rowKey={(record) => {
				return record.index;
			}} onRow={(record) => {
				return {
					onClick: (event) => {
						setcurrentIndex(record.index);
						setIsModalOpen(true);
					},
				}
			}} />
			<Modal title="Basic Modal" open={isModalOpen} onCancel={() => {
				setIsModalOpen(false);
			}}>
				<div className='modal-content'>
					{
						gen_modal_content()
					}
				</div>
			</Modal>
		</div>
	);
}

export default App;
