import 'antd/dist/reset.css';
import './App.css';
import { Table, Modal } from 'antd';
import { useState, useEffect, useRef } from "react";
import { listen } from '@tauri-apps/api/event'
import { appWindow, } from '@tauri-apps/api/window'

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
	const receive_ready = useRef(true);
	useEffect(() => {
		console.log("use effect");
		//const record_map = {};
		let unlistent_handler = null;
		const add_listen = async () => {
			//const record_map = {};
			console.log("add_listen");
			return await listen("fetch-data", (event) => {
				console.log("receive_ready ==== ",receive_ready.current);
				if(!receive_ready.current){
					return;
				}
				const list = dataSource;
				let data = JSON.parse(event.payload);
				list.list[data.index].data = data.data;
				list.list[data.index].task_id = data.task_id;
				let time_seq = new Date().toLocaleTimeString();
				list.list[data.index].time =  time_seq;
				setDataSource({ list: list.list });
				//console.log(new Date().toLocaleTimeString(), data.task_id);
				let index = `index_${data.index}`;
				//const current_data = recordMap.data;
				console.log(Math.random(),time_seq);
				const record_map = recordMap.map;
				if (record_map[index] === undefined) {
					console.log("undefined in record_map");
					record_map[index] = [];
				}
				data.time = time_seq;
				record_map[index].push(data);
				setRecordMap({ map: record_map });
			});
		}
		unlistent_handler = add_listen();
		appWindow.emit('start');
		return async () => {
			receive_ready.current = false;
			console.log("leave");
			appWindow.emit("cancel-all");
			let handler = await unlistent_handler;
			console.log("unlistent====",handler);
			await handler();
			setRecordMap({map:{}});
			setDataSource({list:[
				{ index: 0, data: "" },
				{ index: 1, data: "" },
				{ index: 2, data: "" },
				{ index: 3, data: "" },
				{ index: 4, data: "" }
			]});
			receive_ready.current = true;
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
